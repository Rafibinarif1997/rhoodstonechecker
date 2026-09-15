# RhoodStone Holder Portal — Multipage

Clean URL architecture. Each section is a real page using folder-based `index.html`, so URLs contain no `.html`:
- `/`
- `/benefits/`
- `/partners/`
- `/portal/`
- `/opportunities/`
- `/points/`
- `/rewards/`
- `/passport/`
- `/tiers/`
- `/activity/`

Wallet ownership is checked on Robinhood Chain (4663) against the configured RhoodStone contract. Supabase is intentionally not hardcoded with secrets; points, claims, rewards, campaigns and activity must be connected through Supabase Edge Functions/RLS before being treated as live backend data.
