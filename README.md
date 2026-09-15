# RhoodStone Holder Portal

## Structure
- `/` — wallet verification gate only
- `/portal/` — private holder dashboard
- `/benefits/`
- `/opportunities/`
- `/partners/`
- `/points/`
- `/rewards/`
- `/passport/`
- `/tiers/`
- `/activity/`

All pages use the single `/assets/styles.css` and `/assets/shared.js` files with root-relative paths, so CSS/JS does not break on nested clean URLs.

## On-chain configuration
- Robinhood Chain ID: 4663 (`0x1237`)
- RPC: https://rpc.mainnet.chain.robinhood.com
- Contract: 0x6be906e10351B4a970521c386E89D9e4e34c47C9
- Holder check: ERC-721-style `balanceOf(address)`

## Wallet note
Injected wallets work when the site is opened inside a wallet browser. Normal Android Chrome cannot inject a wallet provider by itself, so the landing page includes an Open in Wallet deep-link fallback.

## Supabase
Points, campaigns, claims, rewards and activity are intentionally not faked. Connect Supabase before enabling those live features.
