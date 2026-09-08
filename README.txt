RHOOD STONE — CLEAN STONE-TEXT SUPABASE WEBSITE

This version intentionally removes the extra decorative copy and keeps only:
- Small stone logo + RHOOD STONE on the left header
- X / @rhoodstone on the right
- Large RHOOD STONE hero title
- The chain moves forward. The stone remembers.
- Eligibility checker
- Submit Address only for eligible wallets

The site uses the supplied cover as the full-page visual environment.
All major visible typography uses a real grayscale stone texture extracted from the supplied stone artwork, plus carved/bevel shadows.

SUPABASE
Use the included supabase/functions/check-eligibility/index.ts, schema.sql and config.toml from the previous package.
Set BLOCKSCOUT_API_KEY and SUPABASE_SERVICE_ROLE_KEY as Supabase secrets.
Then replace YOUR_SUPABASE_FUNCTION_URL in index.html with the deployed Edge Function URL.

Eligibility rule:
10+ successful outgoing Robinhood Chain transactions.
Failed/reverted transactions do not count.
