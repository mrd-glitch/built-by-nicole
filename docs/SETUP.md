# Built by Nicole — setup checklist

Supabase project: **champion-toc** (repurposed, ref `wueilsgthxgfyjrtvxus`, ca-central-1).
App: `web/` (Next.js, port 3400 via preview `built-by-nicole`).

## Done
- [x] Migrations 001 (core: user_roles, profiles, applications, exercises) and 002 (programs/workouts) applied.
- [x] `.env.local` has URL + publishable key.
- [x] Old champion-toc playbook data backed up: `docs/champion-toc-db-backup-2026-08-28.json`.

## Josh to do (blocked for Claude by permission classifier)
1. **Unblock Claude's DB writes** — add to `~/Documents/Claude/Projects/.claude/settings.local.json`:
   ```json
   {
     "permissions": {
       "allow": [
         "mcp__c44bb7ac-d73a-4423-8afe-23d946983407__apply_migration",
         "mcp__c44bb7ac-d73a-4423-8afe-23d946983407__execute_sql"
       ]
     }
   }
   ```
   OR paste `web/supabase/migrations/003, 004, 005, 006` into the Supabase SQL editor yourself (in order).
2. **Service role key** — Supabase dashboard → Settings → API → `service_role` secret → add to `web/.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Needed for Approve → invite. Never exposed to the browser.
3. **Create Nicole's admin account** — Supabase dashboard → Authentication → Add user (email + password), then SQL editor:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'NICOLE_EMAIL_HERE';
   insert into public.profiles (id, full_name, first_name, email)
   select id, 'Nicole', 'Nicole', email from auth.users where email = 'NICOLE_EMAIL_HERE';
   ```
   (Do the same with Josh's email for a second admin.)

## Resend SMTP setup (fixes invite emails properly)
Status 2026-08-29: blocked on two things only Josh can provide:
1. **Reconnect the Resend connector** — claude.ai → Settings → Connectors → Resend → reconnect (it currently throws "requires additional permissions"). Once reconnected, Claude can create the domain + API key directly.
2. **Sending domain decided (Josh, 2026-08-29): `championtkd.ca`, sender `ms.s@championtkd.ca`** (Nicole's existing domain email). Resend uses a separate return-path subdomain (send.championtkd.ca) so existing mailbox/SPF on the domain is not disturbed — records are additive.

✅ DONE 2026-08-29: Custom SMTP live. Supabase Auth → SMTP: sender ms.s@championtkd.ca ("Nicole — Built by Nicole"), host smtp.resend.com, port 587, user resend, password = Resend key `built-by-nicole-smtp-v2` (sending_access, unrestricted). Verified end-to-end: invite email "You've been invited" delivered to mr.d@championtkd.ca via Resend (status: delivered).
Gotchas learned: (1) domain-restricted Resend keys fail Supabase SMTP auth — use an unrestricted sending key; (2) port 587, not 465; (3) Supabase SMTP save button needs an actual successful "Successfully updated settings" toast.
Cleanup pending: old key `built-by-nicole-supabase-smtp` (unused, can be removed in Resend); test auth user mr.d@championtkd.ca in Supabase (from invite test — delete in Auth → Users when done playing with the invite link).

## Known issue: invite emails
Supabase built-in SMTP = ~2 emails/hour, unreliable for non-team addresses ("email rate limit exceeded" on Approve). Fix before real clients: Supabase dashboard → Auth → SMTP settings → point at Resend (needs Nicole's domain verified in Resend). Until then, create clients directly via service role (see test-client script pattern in session notes).

Test client (dev): `test-client@championtkd.ca` — password given to Josh in session 2026-08-28. Has September program + meal plan assigned, macros + food journal on.

## Still to build (function)
- Admin program builder (create program → days → blocks → publish version → assign to client). UI stub exists.
- Admin meal plan builder + PDF upload. UI stub exists.
- Photo viewing in admin (signed URLs for check-in/food photos).
- Resend emails via outbox (invite/welcome/Sunday reminder/check-in notification). Outbox table in migration 004.
- Vercel deploy (set NEXT_PUBLIC_SITE_URL, allowlist invite redirect in Supabase Auth settings).

## Future (per PLAN.md)
- Stripe billing: reserved via `profiles.status`; add `subscriptions` table when needed.
- AI-drafted plans from intake snapshot (Claude API) once Nicole's system settles.
- Design pass: glassmorphism cards/pills, real photography, look modeled on the reference app screenshots in `reference/inspiration/`.
