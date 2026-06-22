# OAuth provider setup (Google, Apple, GitHub, Microsoft)

ImpactMap uses Supabase Auth. Each provider needs credentials in the Supabase dashboard before social sign-in works.

**Project:** `pgvasfubdwkgugoqqfjf`  
**Supabase callback URL (use in every provider):**

```
https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback
```

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

### GitHub

1. [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New
2. Authorization callback URL: `https://pgvasfubdwkgugoqqfjf.supabase.co/auth/v1/callback`
3. Copy Client ID + Client Secret into Supabase **GitHub** provider → Enable

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

1. Visit `/auth/login` or `/auth/signup`
2. Click each provider button
3. After redirect, you should land on `/dashboard` with a profile row created automatically

If a provider shows "not enabled", its credentials are missing in the Supabase dashboard.
