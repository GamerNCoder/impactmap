/** Parse scanned QR / barcode text into an in-app action. */

export type QrScanAction =
  | { type: 'verify'; code: string }
  | { type: 'opportunity'; opportunityId: string }
  | { type: 'volunteer'; volunteerId: string }
  | { type: 'manage'; organizationId: string; volunteerId?: string }
  | { type: 'dashboard'; opportunityId?: string }
  | { type: 'external'; url: string }

const IMP_CODE = /^IMP-[A-F0-9]{8,}$/i
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type ImpactMapPayload = {
  v?: number
  type?: string
  action?: string
  code?: string
  opportunityId?: string
  volunteerId?: string
  organizationId?: string
}

function normalizeCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase()
  return trimmed.startsWith('IMP-') ? trimmed : `IMP-${trimmed.replace(/^IMP-?/i, '')}`
}

function parseJsonPayload(text: string): ImpactMapPayload | null {
  try {
    const data = JSON.parse(text) as ImpactMapPayload
    if (data?.type === 'impactmap' || data?.action) return data
    return null
  } catch {
    return null
  }
}

function parseUrlPath(pathname: string, searchParams: URLSearchParams): QrScanAction | null {
  const verifyMatch = pathname.match(/^\/verify\/(.+)$/i)
  if (verifyMatch) {
    return { type: 'verify', code: normalizeCode(decodeURIComponent(verifyMatch[1])) }
  }

  const oppMatch = pathname.match(/^\/opportunities\/([^/]+)$/i)
  if (oppMatch && UUID.test(oppMatch[1])) {
    return { type: 'opportunity', opportunityId: oppMatch[1] }
  }

  const volunteerMatch = pathname.match(/^\/volunteers\/([^/]+)$/i)
  if (volunteerMatch && UUID.test(volunteerMatch[1])) {
    return { type: 'volunteer', volunteerId: volunteerMatch[1] }
  }

  const manageMatch = pathname.match(/^\/organizations\/([^/]+)\/manage$/i)
  if (manageMatch && UUID.test(manageMatch[1])) {
    const volunteerId = searchParams.get('volunteer') ?? undefined
    return {
      type: 'manage',
      organizationId: manageMatch[1],
      volunteerId: volunteerId && UUID.test(volunteerId) ? volunteerId : undefined,
    }
  }

  const dashboardMatch = pathname === '/dashboard'
  if (dashboardMatch) {
    const opportunityId = searchParams.get('opportunity')
    return {
      type: 'dashboard',
      opportunityId: opportunityId && UUID.test(opportunityId) ? opportunityId : undefined,
    }
  }

  return null
}

export function parseQrScan(text: string): QrScanAction | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  if (IMP_CODE.test(trimmed)) {
    return { type: 'verify', code: normalizeCode(trimmed) }
  }

  const json = parseJsonPayload(trimmed)
  if (json) {
    const action = json.action ?? json.type
    if (action === 'verify' && json.code) {
      return { type: 'verify', code: normalizeCode(json.code) }
    }
    if (action === 'checkin' && json.opportunityId && UUID.test(json.opportunityId)) {
      return { type: 'opportunity', opportunityId: json.opportunityId }
    }
    if (action === 'volunteer' && json.volunteerId && UUID.test(json.volunteerId)) {
      if (json.organizationId && UUID.test(json.organizationId)) {
        return {
          type: 'manage',
          organizationId: json.organizationId,
          volunteerId: json.volunteerId,
        }
      }
      return { type: 'volunteer', volunteerId: json.volunteerId }
    }
    if (action === 'manage' && json.organizationId && UUID.test(json.organizationId)) {
      return {
        type: 'manage',
        organizationId: json.organizationId,
        volunteerId:
          json.volunteerId && UUID.test(json.volunteerId) ? json.volunteerId : undefined,
      }
    }
  }

  try {
    const url = new URL(trimmed)
    const fromPath = parseUrlPath(url.pathname, url.searchParams)
    if (fromPath) return fromPath
    if (url.hostname.includes('impactmap') || url.pathname.startsWith('/')) {
      return { type: 'external', url: url.toString() }
    }
  } catch {
    // not a URL
  }

  if (trimmed.startsWith('/')) {
    try {
      const url = new URL(trimmed, 'https://impactmap.app')
      return parseUrlPath(url.pathname, url.searchParams)
    } catch {
      return null
    }
  }

  return null
}

export function routeForScanAction(action: QrScanAction): string {
  switch (action.type) {
    case 'verify':
      return `/verify/${encodeURIComponent(action.code)}`
    case 'opportunity':
      return `/opportunities/${action.opportunityId}`
    case 'volunteer':
      return `/volunteers/${action.volunteerId}`
    case 'manage': {
      const base = `/organizations/${action.organizationId}/manage`
      return action.volunteerId ? `${base}?volunteer=${action.volunteerId}` : base
    }
    case 'dashboard':
      return action.opportunityId
        ? `/dashboard?opportunity=${action.opportunityId}`
        : '/dashboard'
    case 'external':
      return action.url
  }
}

export function describeScanAction(action: QrScanAction): string {
  switch (action.type) {
    case 'verify':
      return `Verify credential ${action.code}`
    case 'opportunity':
      return 'Open event — join or log hours'
    case 'volunteer':
      return 'Open volunteer passport'
    case 'manage':
      return action.volunteerId
        ? 'Coordinator check-in — volunteer verification'
        : 'Open coordinator dashboard'
    case 'dashboard':
      return 'Open your hub — log hours'
    case 'external':
      return 'Open link'
  }
}
