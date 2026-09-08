// Rhood Stone backend — Cloudflare Worker
// Set BLOCKSCOUT_API_KEY as a Cloudflare Worker Secret.
// Never put the key in index.html.
//
// Eligibility rule:
// 10+ successful OUTGOING transactions on Robinhood Chain = eligible.
//
// Robinhood Chain:
// Chain ID: 4663
// Blockscout API: https://api.blockscout.com/4663/api/v2

const BASE = "https://api.blockscout.com/4663/api/v2";
const MIN_SUCCESSFUL = 10;

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function getJson(url, apiKey) {
  const r = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Accept": "application/json"
    }
  });

  if (!r.ok) throw new Error(`Blockscout HTTP ${r.status}`);
  return await r.json();
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    const url = new URL(request.url);
    const address = (url.searchParams.get("address") || "").trim();

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return json({ error: "Invalid wallet address" }, 400, origin);
    }

    if (!env.BLOCKSCOUT_API_KEY) {
      return json({ error: "Server is not configured" }, 500, origin);
    }

    try {
      // We only need to know whether the wallet has reached 10.
      // Stop pagination as soon as 10 successful transactions are found.
      let successful = 0;
      let nextParams = null;

      for (let page = 0; page < 20; page++) {
        const endpoint = new URL(
          `${BASE}/addresses/${address}/transactions`
        );

        endpoint.searchParams.set("items_count", "50");

        if (nextParams) {
          for (const [key, value] of Object.entries(nextParams)) {
            if (value !== null && value !== undefined) {
              endpoint.searchParams.set(key, String(value));
            }
          }
        }

        const data = await getJson(endpoint.toString(), env.BLOCKSCOUT_API_KEY);
        const items = Array.isArray(data.items) ? data.items : [];

        for (const tx of items) {
          if (tx.status === "ok") {
            successful++;
            if (successful >= MIN_SUCCESSFUL) {
              return json({ eligible: true }, 200, origin);
            }
          }
        }

        if (!data.next_page_params || items.length === 0) break;
        nextParams = data.next_page_params;
      }

      return json({ eligible: false }, 200, origin);
    } catch (e) {
      return json({ error: "Unable to query transaction history" }, 502, origin);
    }
  }
};
