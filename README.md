# Nexus — Real-Time Visual Analytics

## Vercel
Upload/import the project root. Framework: Vite. Build: `npm run build`. Output: `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Supabase
Run `supabase/schema.sql` once in the Supabase SQL Editor. It creates profiles, telemetry, API keys, RLS, the auth profile trigger, timestamps, and Realtime configuration.

Set Authentication → URL Configuration Site URL to the production Vercel URL. Allow the production URL and `/forgot-password` as redirect URLs.

For Google login, enable Google under Supabase Authentication → Sign In / Providers and enter the Google OAuth client ID/secret there.
