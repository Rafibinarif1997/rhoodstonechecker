# Rhoodstone GTD — Production Starter

This is the complete Vite/React source for the Rhoodstone GTD utility.

## Included
- Main landing page
- Real Robinhood Chain ERC-721 `balanceOf` holder verification
- Separate protected holder dashboard
- Automatic holder re-check every 30 seconds
- Live campaign loading from Supabase
- Holder-only Open Box flow
- Atomic one-claim-per-wallet/campaign RPC
- Project owner GTD submission form
- Supabase schema for projects, inventory, campaigns and claims
- Admin sign-in UI + campaign creation
- Responsive premium dark UI
- Your Rhoodstone hero assets

## Your three environment variables
Create `.env.local`:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_REOWN_PROJECT_ID=...

Also set:
VITE_OPENSEA_URL=YOUR_REAL_RHOODSTONE_OPENSEA_COLLECTION_URL
VITE_ADMIN_EMAIL=YOUR_ADMIN_EMAIL

## Supabase
1. Create a Supabase project.
2. Open SQL Editor.
3. Paste and run `supabase/schema.sql`.
4. Create your admin user under Supabase Authentication.
5. Add the env values to `.env.local`.
6. Run:
   npm install
   npm run dev
7. Build:
   npm run build

## Important production security
The supplied SQL makes the core claim operation atomic, but admin authorization should be tightened before public launch. Do not expose service-role keys in Vite. The anon key is intended for browser use; privileged actions must be protected by RLS/server-side logic.

## GTD delivery
The claim row records the holder and reward. To deliver real GTD allocations, the production version should attach a unique claim code/whitelist slot to each GTD reward and mark it assigned/claimed. The project owner can supply claim links/codes during submission and the admin approves them.

## Routes
/              Home
/dashboard     Verified holder dashboard
/submit        Holder/project submission
/admin         Admin panel


## Configuration already inserted
The supplied Supabase URL, Supabase anon/public key, Reown Project ID, and OpenSea link are already in `.env.local`.

## One thing that cannot be done from a static ZIP
I cannot execute SQL inside your private Supabase project from this chat. Run `supabase/schema.sql` once in Supabase SQL Editor. After that the live campaign/claim tables and RPC are ready for the app.

Do NOT put a Supabase service-role key into this project.
