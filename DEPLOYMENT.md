# AURA deployment

The personal workspace uses the existing Vercel project `aura-nutrition-ai` in `aura-team15` and Supabase project `bpfjyxfvjxlqpqrpesff`.

Required server configuration:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable/anon client key; never a service-role key)
- GEMINI_API_KEY (sensitive, server-only)
- GEMINI_MODEL (optional, default gemini-2.5-flash)

Apply the committed migrations in order. On the existing database, the initial migration and personal_workspace_and_ai_limits migration have already been applied. Do not rerun the initial schema SQL.

Configure Supabase Auth Site URL to the production origin. Allow `/auth/callback` and `/auth/callback?next=/reset-password`. Email confirmation and recovery must be tested with your actual email account. Keep Vercel protection enabled for personal use.

CI installs exact locked dependencies, type-checks, runs unit tests, and builds. Before release, verify food/weight CRUD, chat persistence, meal estimation, export, and two-account isolation. AI request limits are atomic, per account, 60 requests/hour, with counters in a private schema. The intentional default-deny RLS on the counter table has no user-facing policies.

Remote MCP and multi-client coaching are not enabled by this personal-use release.
