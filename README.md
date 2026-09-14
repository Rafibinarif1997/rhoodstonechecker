# RH Copilot — Multi-Page Root Build

A production-minded independent intelligence interface for Robinhood Chain.

## Pages
- `/` — Landing page
- `/dashboard.html`
- `/stock-token-terminal.html`
- `/defi-opportunities.html`
- `/bridge-intelligence.html`
- `/contract-intelligence.html`
- `/discover-projects.html`
- `/watchlist.html`
- `/developer.html`
- `/about.html`

All pages share the same wallet session. Connect once; every page sees the same connected account. Clicking the connected wallet opens a disconnect action. The site clears its local session and requests wallet permission revocation where supported.

## Run
Node.js 20+
`npm install`
`npm start`

Set `ADMIN_KEY` and optional `ALCHEMY_API_KEY` in `.env`.

This is independent software and is not affiliated with or endorsed by Robinhood.
