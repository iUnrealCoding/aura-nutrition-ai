# AURA production deployment checklist

Repository: https://github.com/iUnrealCoding/aura-nutrition-ai
Supabase: https://bpfjyxfvjxlqpqrpesff.supabase.co

## 1. Supabase
Run `supabase/migrations/0001_init.sql` using Supabase SQL Editor on your project. Confirm RLS policies and the private food-images bucket. In Authentication > URL Configuration, set the Site URL to your Vercel domain and add `https://YOUR-VERCEL-DOMAIN/auth/callback` and `https://YOUR-VERCEL-DOMAIN/reset-password` as redirect URLs. Configure SMTP for public signup.

## 2. Vercel
Import the GitHub repository as a Next.js project. Add `NEXT_PUBLIC_SUPABASE_URL=https://bpfjyxfvjxlqpqrpesff.supabase.co`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase API settings, and `GEMINI_API_KEY` from your own Google AI Studio account. Never expose `GEMINI_API_KEY` with a NEXT_PUBLIC prefix. Never commit secrets.

## 3. Verification
Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build`. Test sign-up, confirmation, sign-in, password recovery, meal creation, scale logging, image upload, chat streaming, and data separation between two accounts. Configure monitoring and rate limits. Check GDPR/privacy obligations before public launch.

## Important limitations
The current Gemini configuration uses a server-owned key, not encrypted per-athlete BYOK. ChatGPT remote MCP is disabled until a proper OAuth authorization server, scopes, consent, audit logs, and revocation are implemented. The dashboard displays weight EMA as a list, not yet a chart. Public registration must remain disabled until all production tests pass.
