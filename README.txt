RHOOD STONE — SUPABASE CHECKER

FLOW
1. User enters a wallet address.
2. Clicks "Check Eligibility".
3. If eligible, "Submit Address" appears.
4. Only after the user clicks "Submit Address" is the wallet saved to Supabase.
5. If not eligible, the Submit Address button never appears.

SECURITY
- Never put BLOCKSCOUT_API_KEY in index.html.
- Add BLOCKSCOUT_API_KEY as a Supabase Edge Function secret.
- SUPABASE_SERVICE_ROLE_KEY is used only by the Edge Function to write to the database.
- The submit action re-checks eligibility server-side, so users cannot submit arbitrary ineligible addresses by bypassing the frontend.

SETUP
1. In Supabase SQL Editor, run schema.sql.
2. Deploy the Edge Function:
   supabase functions deploy check-eligibility
3. Add the Blockscout API key as an Edge Function secret:
   supabase secrets set BLOCKSCOUT_API_KEY=YOUR_KEY
   Do NOT paste the key into the website.
4. Your function URL will be:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-eligibility
5. In index.html replace:
   YOUR_SUPABASE_FUNCTION_URL
   with your real function URL.
6. Upload index.html + assets to GitHub Pages or your hosting.

ELIGIBLE LIST
Submitted addresses are stored in:
public.eligibility_checks

In Supabase:
Table Editor → eligibility_checks

You can export the table as CSV.

IMPORTANT
Only wallets whose owners click "Submit Address" are saved.
Failed/reverted transactions do not count.
The checker counts successful outgoing transactions from the wallet.
