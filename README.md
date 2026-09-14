# RH//COPILOT

Single-page independent financial intelligence interface for Robinhood Chain.

## What works
- Robinhood Chain RPC health, latest block and gas readout
- EVM wallet connection + automatic Robinhood Chain network switching
- Native ETH balance
- Known ERC-20 balance scanner for Robinhood Stock Tokens, WETH and USDG
- Official Robinhood Chain Stock Token registry and live bid/ask quotes
- Stock Token contract links and read-only ERC-20 inspection
- Address / contract scanner
- Persistent watchlist
- Bridge intelligence sourced from documented Robinhood Chain routes
- Project submission -> pending -> same-page admin approval/rejection
- Official resource links
- Responsive single-page UI

## Run
Node.js 20+ is required.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Environment
Copy `.env.example` to `.env`.

- `PORT=3000`
- `RH_RPC_URL=https://rpc.mainnet.chain.robinhood.com`
- `ADMIN_KEY=change-me`
- `WALLET_TOKEN_LIMIT=80`

The public Robinhood Chain RPC is rate-limited. For production, use a managed provider such as Alchemy and set `RH_RPC_URL` accordingly.

## Admin
Set `ADMIN_KEY`. Open **Admin Review** at the bottom of the same page and enter the key. Pending project submissions can be approved or rejected without another page.

## Important
This product is independent and is not official or endorsed by Robinhood. It does not fabricate APYs, bridge fees, execution quotes or investment recommendations.
