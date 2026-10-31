# AURA — Nutrition intelligence

Personal nutrition workspace built with Next.js, Supabase and Gemini.

## Features

- Email/password authentication, recovery, account settings and sign-out
- Food diary with date selection, full macro/micronutrient entry, edit, delete and repeat
- Optional photo/description AI estimates, reviewed before saving
- Weight logging and editing with smoothed trend charts
- TDEE estimates only across aligned windows with explicitly complete food days
- Persistent contextual AI coaching with streaming, error recovery and hourly request limits
- Private image storage, per-user row isolation, and JSON data export
- Responsive interface with accessible labels and keyboard-operable dialogs

## Development

Copy `.env.example` to `.env.local` and set your own values. Never commit secrets.
Run `npm ci`, `npm run dev`. Checks: `npm run typecheck`, `npm test`, `npm run build`.
Apply SQL migrations in order. Supabase Auth must allow the deployed `/auth/callback` and `/auth/callback?next=/reset-password` redirects.

## Scope

This release is for personal use. It is not a medical service. AI estimates need review. The diary displays the most recent year; export includes all records. Remote ChatGPT MCP remains intentionally disabled; a separately registered OAuth integration is outside this personal web-app release. No synthetic data is shown as real progress.
