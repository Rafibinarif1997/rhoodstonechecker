RHOOD STONE — COMPLETE SUPABASE WEBSITE

WHAT IT DOES
- Uses the supplied Rhood Stone cover and stone logo.
- Checks Robinhood Chain wallet eligibility.
- Eligibility rule: 10+ successful outgoing transactions.
- Failed/reverted transactions do not count.
- "Submit Address" appears ONLY after an eligible result.
- Clicking Submit Address saves the wallet to Supabase.
- The Edge Function re-checks eligibility before saving.
- The Blockscout API key is never exposed to the browser.

SETUP

A) SUPABASE DATABASE
1. Open Supabase → SQL Editor.
2. Paste and run schema.sql.

B) SUPABASE EDGE FUNCTION
1. Install/login to Supabase CLI.
2. From this project folder run:
   supabase functions deploy check-eligibility
3. Set secrets:
   supabase secrets set BLOCKSCOUT_API_KEY=YOUR_BLOCKSCOUT_KEY
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
4. Function URL:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-eligibility

Never put either secret inside index.html.

C) FRONTEND
Open index.html and replace:
YOUR_SUPABASE_FUNCTION_URL
with the Edge Function URL.

Then upload the whole folder to GitHub Pages (or another static host).

D) GET WL ADDRESSES
Every user who passes the check AND clicks Submit Address is saved in:
public.eligibility_checks

Supabase → Table Editor → eligibility_checks

Export that table to CSV when you need the WL list.

IMPORTANT
Only explicitly submitted eligible wallets are saved.
The checker does not reveal the exact transaction count to the user.
