RHOOD STONE — SIMPLE ELIGIBILITY CHECKER

Rule:
10+ successful outgoing transactions on Robinhood Chain = Eligible.

Files:
- index.html — frontend checker
- assets/logo.png — Rhood Stone logo
- assets/cover.png — Rhood Stone Twitter cover
- worker.js — secure backend

SECURITY:
Never put your Blockscout API key in index.html.

Cloudflare Worker:
1. Create a Worker.
2. Paste worker.js.
3. Add a Worker Secret named:
   BLOCKSCOUT_API_KEY
4. Put your Blockscout key there.
5. Deploy.
6. Copy the Worker URL.
7. In index.html replace:
   YOUR_BACKEND_URL
   with your Worker URL.

The frontend returns only Eligible / Not Eligible.
The transaction threshold is not exposed in the UI.

Note:
The backend counts successful transactions returned by Blockscout's address-transactions endpoint. It stops as soon as 10 successful transactions are found.
