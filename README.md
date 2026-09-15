# RhoodStone Holder Portal

Production-oriented frontend foundation for the RhoodStone holder-gated website.

## Configured

- Network: Robinhood Chain
- Chain ID: 4663
- RPC: https://rpc.mainnet.chain.robinhood.com
- Contract: 0x6be906e10351B4a970521c386E89D9e4e34c47C9
- Wallet-gated holder portal
- On-chain `balanceOf(address)` verification
- Automatic Robinhood Chain switching
- Holder tiers based on NFT balance
- WL/GTD, points, rewards, partner and passport UI

## Important

The current frontend verifies ERC-721 `balanceOf(address)`. Before the public launch, the contract should be verified for its actual NFT standard and interface. The portal's points, campaigns, claims, rewards and admin operations should be moved to a secure backend/database rather than trusting browser state.

## Recommended production architecture

Frontend:
- React/Next.js or keep the static UI if preferred
- viem/wagmi for wallet and chain interaction

Backend:
- Node/Next.js API routes
- PostgreSQL/Supabase
- Admin wallet signature authentication
- Campaign, allocation, points and claim tables

Indexer:
- Alchemy/Blockscout/indexed event source
- Reconcile ownership when users connect
- Optional scheduled ownership sync

Admin:
- Partners
- Campaigns
- WL/GTD allocations
- Holder eligibility
- Points
- Rewards
- Announcements
- Claims/history

Security:
- Never put admin private keys in frontend code.
- Never treat client-side points as authoritative.
- Claim records should be server-side and idempotent.
- If claims cause on-chain transactions, use a controlled signer or user-signed transaction flow.

## Run locally

Because this uses browser wallet APIs, serve the folder from a local web server rather than opening `index.html` directly.

Example:
`python3 -m http.server 8080`

Then open:
`http://localhost:8080`

## Deployment

This folder can be deployed to Vercel, Netlify, GitHub Pages (with suitable static routing), or any static hosting provider.
