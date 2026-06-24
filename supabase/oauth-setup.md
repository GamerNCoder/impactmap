# OAuth provider setup (Google, Apple, Microsoft)

ImpactMap uses Supabase Auth. **Social sign-in buttons only appear for providers listed in `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS`.** GitHub is not supported. If that env var is empty, the app defaults to Google, Apple, and Microsoft.

**Project:** `pgvasfubdwkgugoqqfjf`  
**Supabase callback URL (use in every provider):**

```
https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback
```

## 0. Enable a provider in the app (required after Supabase setup)

After configuring a provider in Supabase (steps below), add it to your env:

```bash
# Local: .env.local
NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,apple,azure

# Vercel: Project Settings → Environment Variables (all environments)
NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=google,apple,azure
```

Valid values (comma-separated): `google`, `apple`, `azure`

**Do not add a provider here until it is enabled with credentials in Supabase.**  
Rebuild/redeploy after changing this variable.

## 1. Supabase URL configuration

In [Authentication → URL Configuration](https://supabase.com/dashboard/project/pgvasfubdwkgugoqqfjf/auth/url-configuration):

| Setting | Values |
|---------|--------|
| Site URL | `https://impactmap.vercel.app` |
| Redirect URLs | `https://impactmap.vercel.app/auth/callback`, `http://localhost:3000/auth/callback` |

## 2. Enable providers

Open [Authentication → Providers](https://supabase.com/dashboard/project/pgvasfubdwkgugoqqfjf/auth/providers) and configure each provider below.

### Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create **OAuth client ID** (Web application)
3. Authorized redirect URI: `https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback`
4. Copy Client ID + Client Secret into Supabase **Google** provider → Enable

### Apple

1. [Apple Developer](https://developer.apple.com/account/resources/identifiers/list) → Services IDs
2. Enable Sign in with Apple; configure domains and return URL:
   - Domain: `pgvasfubdwkgugoqqfjf.supabase.co`
   - Return URL: `https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback`
3. Create a Sign in with Apple key; note Team ID, Key ID, Services ID, and private key
4. Enter credentials in Supabase **Apple** provider → Enable

### Microsoft (Azure)

Supabase uses the **Azure** provider for Microsoft accounts.

1. [Azure Portal](https://portal.azure.com/) → App registrations → New registration
2. Redirect URI (Web): `https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback`
3. Create a client secret under Certificates & secrets
4. Copy Application (client) ID + secret into Supabase **Azure** provider → Enable

## 3. Test

1. Set `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` to the provider(s) you configured
2. Restart dev server or redeploy Vercel
3. Visit `/auth/login`
4. Only Google, Apple, and/or Microsoft should appear — never GitHub
5. After redirect, you should land on `/dashboard` with a profile row created automatically

If no OAuth buttons appear, check that at least one valid provider is listed in the env var.
