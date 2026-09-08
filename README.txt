RHOOD STONE — SUPABASE VERSION

RULE
10+ successful OUTGOING transactions on Robinhood Chain = Eligible.
Failed/reverted transactions do not count.

ARCHITECTURE
GitHub Pages/frontend -> Supabase Edge Function -> Blockscout API
The Blockscout API key stays server-side in Supabase.

1) Create a Supabase project.
2) Open SQL Editor and run schema.sql.
3) Deploy the Edge Function folder:
   supabase/functions/check-eligibility/index.ts
   and supabase/config.toml

CLI (recommended):
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy check-eligibility --no-verify-jwt

4) Add this Supabase Edge Function secret:
   BLOCKSCOUT_API_KEY = YOUR_NEW_BLOCKSCOUT_KEY

   Do NOT put the Blockscout key in index.html or GitHub.

5) Your function URL will be:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-eligibility

6) Open index.html and replace:
   YOUR_SUPABASE_FUNCTION_URL
   with that function URL.

7) Upload index.html + assets/ to GitHub Pages.

ELIGIBLE ADDRESS LIST
Every wallet that checks successfully is automatically saved in:
   Table Editor -> eligibility_checks

The table contains:
- address
- eligible
- successful_transactions
- checked_at

You can export the table as CSV from Supabase. This gives you the addresses of eligible users who actually used the checker.

IMPORTANT
This does NOT automatically discover wallets that never visit the checker. To build a complete chain-wide eligible list, a separate Blockscout transaction scan is needed. I can make that scanner too.


VISUAL
The site now uses assets/stone-world.png as the full-page stone/ancient-world background and a carved-stone UI treatment for all text and controls.
