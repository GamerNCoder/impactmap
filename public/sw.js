/*
 * ImpactMap service worker.
 *
 * Registered by src/components/ServiceWorkerRegister.tsx — production builds only, and
 * only on secure origins (https / localhost). See that file for the registration guard.
 *
 * Why this worker is deliberately small: most of ImpactMap is server-rendered and
 * personalised (dynamic routes read the Supabase session through cookies), so a cache that
 * serves HTML it did not just get from the network can show one student another student's
 * page. The rules below keep that from being possible:
 *
 *  1. Only GET requests that are same-origin and outside /api/ are intercepted. Cross-origin
 *     calls (Supabase REST / Realtime / Storage) and every /api/* route always go straight
 *     to the network, so nothing here can answer a check-in or a profile read.
 *  2. HTML is never written to a cache from the network. Offline navigations get a
 *     generated document (see offlineDocument()) saying the action was NOT recorded. The
 *     single cached document is the start_url "/", captured at install time with credentials
 *     omitted (so it is always the signed-out shell) and served only for offline navigations
 *     to exactly "/". /checkin/*, /auth/*, /dashboard/* and everything else are never served
 *     from a cache.
 *  3. /_next/static/* is content-hashed and immutable, so cache-first is safe there. That is
 *     also what makes the offline document (and the cached shell) usable offline.
 *  4. No skipWaiting(): an installed worker keeps serving until its clients are gone, so a
 *     half-rolled-out worker cannot take over a session mid-check-in. clients.claim() is
 *     used, so a first install does control the page that registered it.
 *  5. Install never fails: missing shell assets are tolerated (Promise.allSettled), because a
 *     worker that fails to install is a worker that does nothing at all.
 *
 * Offline check-in hand-off: two ways in, one queue.
 *  a. A document navigation to /checkin/<id> (the student's phone camera opens the QR URL):
 *     the offline document generated below appends { opportunityId, queuedAt, userHint } to
 *     localStorage[PENDING_CHECKINS_KEY] by itself.
 *  b. An in-app scan while offline: the scanner's router.push() fails inside the App Router,
 *     so this worker only observes the failure and postMessages CHECK_IN_UNREACHABLE to the
 *     page, which appends to the same queue.
 * ServiceWorkerRegister.tsx owns that queue from then on: it replays each entry through the
 * same authenticated check_in_event RPC the check-in page uses, and removes an entry only once
 * the server confirms it. Nothing in this worker ever reports a check-in as recorded.
 */

const CACHE_VERSION = 'v1'
const SHELL_CACHE = `impactmap-shell-${CACHE_VERSION}`
const ASSET_CACHE = `impactmap-assets-${CACHE_VERSION}`
const ACTIVE_CACHES = [SHELL_CACHE, ASSET_CACHE]

/** App-shell assets, precached at install. "/" is the PWA start_url. */
const SHELL_URLS = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png']

/** Immutable, content-hashed build output plus the static PWA files. */
const ASSET_PATH_PREFIXES = ['/_next/static/']
const ASSET_EXACT_PATHS = [
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
]
const MAX_ASSET_ENTRIES = 80

/** localStorage key shared with src/components/ServiceWorkerRegister.tsx — keep in sync. */
const PENDING_CHECKINS_KEY = 'impactmap:pending-checkins'
const MAX_PENDING = 20

/** postMessage type shared with src/components/ServiceWorkerRegister.tsx — keep in sync. */
const CHECK_IN_UNREACHABLE = 'impactmap:check-in-unreachable'

/** Only well-formed, injection-safe opportunity ids are treated as a check-in route. */
const CHECKIN_PATH = /^\/checkin\/([A-Za-z0-9_-]{1,64})\/?$/

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE)
      await Promise.allSettled(
        SHELL_URLS.map((url) =>
          cache.add(
            new Request(url, {
              cache: 'reload',
              // The start_url is cached signed-out on purpose: a shared device must never be
              // handed back somebody else's rendering of the app shell.
              credentials: url === '/' ? 'omit' : 'same-origin',
            })
          )
        )
      )
    })()
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((key) => key.startsWith('impactmap-') && !ACTIVE_CACHES.includes(key)).map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return // POST/PUT (RPC, track beacons) is never touched

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  if (url.origin !== self.location.origin) return // Supabase and other origins: hands off
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request, url))
    return
  }

  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (isInAppCheckInFetch(request, url)) {
    event.respondWith(watchInAppCheckIn(event, request, url))
    return
  }
  // Everything else (other RSC payload fetches, data requests, ...) goes to the network
  // untouched, so offline failures surface as normal fetch errors instead of a stale document.
})

/**
 * The in-app QR scanner checks in with router.push('/checkin/<id>'), which the App Router
 * performs as an RSC fetch rather than a document navigation — so it cannot be answered with
 * the offline document. Its failure is observable though, and that is enough to rescue the
 * check-in: tell the page that made the request, then let the failure happen exactly as it
 * would have without this worker (the rejection is re-thrown, never replaced with a response).
 *
 * The guards keep this narrow: GET only, the RSC variant only (its header), never a prefetch
 * (this app has no <Link> to /checkin, so the only RSC request to that route is a real one),
 * and only a well-formed opportunity id.
 */
function isInAppCheckInFetch(request, url) {
  if (!CHECKIN_PATH.test(url.pathname)) return false
  if (request.headers.get('RSC') !== '1') return false
  if (request.headers.get('next-router-prefetch')) return false
  return true
}

async function watchInAppCheckIn(event, request, url) {
  try {
    return await fetch(request)
  } catch (error) {
    const match = CHECKIN_PATH.exec(url.pathname)
    if (match) await notifyClientOfFailedCheckIn(event.clientId, match[1])
    throw error
  }
}

/** Best effort: hands the opportunity id to the page, which owns the offline queue. */
async function notifyClientOfFailedCheckIn(clientId, opportunityId) {
  try {
    const message = { type: CHECK_IN_UNREACHABLE, opportunityId }
    if (clientId) {
      const client = await self.clients.get(clientId)
      if (client) {
        client.postMessage(message)
        return
      }
    }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) client.postMessage(message)
  } catch {
    // Nothing to do: the check-in simply behaves like an ordinary offline failure.
  }
}

async function navigate(request, url) {
  try {
    return await fetch(request)
  } catch {
    // Offline (or the network died mid-request). Only the start_url has a cached document;
    // every other route gets the generated offline document below.
    if (url.pathname === '/') {
      const cache = await caches.open(SHELL_CACHE)
      const shell = await cache.match('/')
      if (shell) return shell
    }
    return offlineDocument(url.pathname)
  }
}

function isImmutableAsset(pathname) {
  return (
    ASSET_EXACT_PATHS.includes(pathname) ||
    ASSET_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  )
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response && response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
      trimCache(cache)
    }
    return response
  } catch (error) {
    const fallback = await caches.match(request)
    if (fallback) return fallback
    throw error
  }
}

function trimCache(cache) {
  cache.keys().then((keys) => {
    const excess = keys.length - MAX_ASSET_ENTRIES
    if (excess <= 0) return
    Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)))
  })
}

/* ─────────────── offline documents ─────────────── */

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

/** Path used for links inside the offline document — anything odd falls back to "/". */
function safePathname(pathname) {
  if (typeof pathname !== 'string' || pathname.charAt(0) !== '/') return '/'
  return /^[A-Za-z0-9/._~%!$&'()*+,;=:@-]*$/.test(pathname) ? pathname : '/'
}

function offlineDocument(pathname) {
  const path = safePathname(pathname)
  const match = CHECKIN_PATH.exec(path)
  if (match) return checkInDocument(match[1])
  return genericDocument(path)
}

function offlineResponse(html) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  })
}

function documentShell({ title, heading, body, script }) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex">',
    `<meta name="theme-color" content="#047857">`,
    `<title>${escapeHtml(title)}</title>`,
    '<style>',
    ':root{color-scheme:light dark}',
    '*{box-sizing:border-box}',
    'body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f9fafb;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.55}',
    '.card{width:100%;max-width:32rem;background:#fff;border:1px solid #e5e7eb;border-radius:1rem;padding:24px;box-shadow:0 1px 2px rgb(0 0 0 / 0.05)}',
    '.badge{display:inline-flex;align-items:center;gap:.5rem;margin:0 0 .75rem;font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#047857}',
    '.dot{width:.5rem;height:.5rem;border-radius:999px;background:#10b981}',
    'h1{margin:0 0 .5rem;font-size:1.375rem;line-height:1.25}',
    'p{margin:0 0 .75rem;font-size:.9375rem}',
    '.status{border-radius:.75rem;padding:.75rem .875rem;font-size:.875rem;margin:1rem 0}',
    '.status.saved{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}',
    '.status.failed{background:#fffbeb;border:1px solid #fde68a;color:#78350f}',
    '.actions{display:flex;flex-wrap:wrap;gap:.625rem;margin-top:1.25rem}',
    'a.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:.625rem 1.125rem;border-radius:.75rem;font-weight:600;text-decoration:none}',
    'a.primary{background:#047857;color:#fff}',
    'a.secondary{border:1px solid #d1d5db;color:#111827}',
    '.note{margin:1rem 0 0;font-size:.8125rem;color:#6b7280}',
    'a:focus-visible,button:focus-visible{outline:2px solid #10b981;outline-offset:2px}',
    '@media (prefers-color-scheme:dark){',
    'body{background:#030712;color:#f3f4f6}',
    '.card{background:#111827;border-color:#1f2937}',
    '.badge{color:#34d399}',
    '.status.saved{background:#022c22;border-color:#064e3b;color:#a7f3d0}',
    '.status.failed{background:#451a03;border-color:#78350f;color:#fde68a}',
    'a.secondary{border-color:#374151;color:#f3f4f6}',
    '.note{color:#9ca3af}',
    '}',
    '</style>',
    '</head>',
    '<body>',
    '<main class="card">',
    '<p class="badge"><span class="dot"></span>Offline</p>',
    `<h1>${escapeHtml(heading)}</h1>`,
    body,
    '</main>',
    script ? `<script>${script}</script>` : '',
    '</body>',
    '</html>',
  ].join('\n')
}

function checkInDocument(opportunityId) {
  const idJson = JSON.stringify(opportunityId).replace(/</g, '\\u003c')
  const retryHref = `/checkin/${encodeURIComponent(opportunityId)}`

  const body = [
    '<p>Your phone has no connection, so this check-in has <strong>not</strong> reached ImpactMap yet. Nothing has been recorded.</p>',
    '<div id="saved" class="status saved" role="status" hidden>Saved on this device. ImpactMap will send it as soon as you are back online — leave it saved and it will not be lost.</div>',
    '<div id="failed" class="status failed" role="alert" hidden>We could not save this check-in on your device (browser storage is unavailable). Tell the organizer at the sign-in table so your attendance is not lost.</div>',
    '<div id="online" class="status saved" role="status" hidden>You are back online. Tap &ldquo;Try again&rdquo; to finish checking in now.</div>',
    '<div class="actions">',
    `<a class="button primary" href="${escapeHtml(retryHref)}">Try again</a>`,
    '<a class="button secondary" href="/">Go home</a>',
    '</div>',
    '<p class="note">Only the signed-in student on this device is checked in when the saved check-in is sent. If you are unsure, tell the organizer — they can mark you present.</p>',
  ].join('\n')

  return offlineResponse(
    documentShell({
      title: 'Offline — check-in not recorded yet | ImpactMap',
      heading: 'Check-in saved for later',
      body,
      script: checkInQueueScript(idJson),
    })
  )
}

function genericDocument(path) {
  const body = [
    '<p>This page needs a connection. ImpactMap could not reach the network, so nothing on this screen was loaded or changed.</p>',
    `<p class="note">Requested: <code>${escapeHtml(path)}</code></p>`,
    '<div class="actions">',
    `<a class="button primary" href="${escapeHtml(path)}">Try again</a>`,
    '<a class="button secondary" href="/">Go home</a>',
    '</div>',
  ].join('\n')

  return offlineResponse(
    documentShell({
      title: 'Offline | ImpactMap',
      heading: "You're offline",
      body,
      script: '',
    })
  )
}

/**
 * Runs inside the offline document. It stores the check-in so
 * ServiceWorkerRegister.tsx can replay it, and it never claims the check-in was recorded.
 */
function checkInQueueScript(idJson) {
  return [
    '(function(){',
    `var KEY=${JSON.stringify(PENDING_CHECKINS_KEY)};`,
    `var ID=${idJson};`,
    `var MAX=${MAX_PENDING};`,
    "var saved=document.getElementById('saved');",
    "var failed=document.getElementById('failed');",
    "var online=document.getElementById('online');",
    'function b64url(value){',
    "var s=value.replace(/-/g,'+').replace(/_/g,'/');",
    "while(s.length%4){s+='=';}",
    'return atob(s);',
    '}',
    '/* Best effort: which account is signed in on this device? null when we cannot tell. */',
    'function userHint(){',
    'try{',
    'var cookies=document.cookie?document.cookie.split("; "):[];',
    'var parts={};',
    'for(var i=0;i<cookies.length;i++){',
    'var raw=cookies[i];var eq=raw.indexOf("=");',
    'if(eq<0){continue;}',
    'var m=/^(sb-.*-auth-token)(?:\\.(\\d+))?$/.exec(raw.slice(0,eq));',
    'if(!m){continue;}',
    'var value=raw.slice(eq+1);',
    'if(value.indexOf("%")>=0){value=decodeURIComponent(value);}',
    'var idx=m[2]?parseInt(m[2],10):0;',
    'if(!parts[m[1]]){parts[m[1]]=[];}',
    'parts[m[1]][idx]=value;',
    '}',
    'for(var key in parts){',
    'try{',
    'var joined=parts[key].join("");',
    'if(joined.slice(0,7)==="base64-"){joined=b64url(joined.slice(7));}',
    'var session=JSON.parse(joined);',
    'var token=session&&session.access_token;',
    'if(typeof token!=="string"){continue;}',
    'var claims=JSON.parse(b64url(token.split(".")[1]));',
    'if(claims&&typeof claims.sub==="string"&&claims.sub){return claims.sub;}',
    '}catch(e){}',
    '}',
    '}catch(e){}',
    'return null;',
    '}',
    'try{',
    'var list=[];',
    'try{',
    'var rawList=localStorage.getItem(KEY);',
    'var parsed=rawList?JSON.parse(rawList):[];',
    'if(Object.prototype.toString.call(parsed)==="[object Array]"){list=parsed;}',
    '}catch(e){}',
    'var kept=[];',
    'for(var i=0;i<list.length;i++){',
    'var item=list[i];',
    'if(item&&item.opportunityId!==ID){kept.push(item);}',
    '}',
    'kept.push({opportunityId:ID,queuedAt:Date.now(),userHint:userHint()});',
    'if(kept.length>MAX){kept=kept.slice(kept.length-MAX);}',
    'localStorage.setItem(KEY,JSON.stringify(kept));',
    'saved.hidden=false;',
    '}catch(e){',
    'failed.hidden=false;',
    '}',
    "window.addEventListener('online',function(){online.hidden=false;});",
    'if(navigator.onLine){online.hidden=false;}',
    '})();',
  ].join('\n')
}
