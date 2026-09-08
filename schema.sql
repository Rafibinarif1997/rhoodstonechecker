const BLOCKSCOUT_BASE = "https://api.blockscout.com/4663/api/v2";
const MIN_SUCCESSFUL = 10;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const blockscoutKey = Deno.env.get("BLOCKSCOUT_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!blockscoutKey) return json({ error: "Server is not configured" }, 500);

  let body: { address?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const address = String(body.address || "").trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return json({ error: "Invalid wallet address" }, 400);

  let successful = 0;
  let next: Record<string, string | number> | null = null;

  try {
    for (let page = 0; page < 100; page++) {
      const url = new URL(`${BLOCKSCOUT_BASE}/addresses/${address}/transactions`);
      url.searchParams.set("filter", "from");
      if (next) for (const [k, v] of Object.entries(next)) url.searchParams.set(k, String(v));

      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${blockscoutKey}` } });
      if (!r.ok) return json({ error: `Blockscout request failed (${r.status})` }, 502);
      const data = await r.json();
      const items = Array.isArray(data.items) ? data.items : [];

      for (const tx of items) {
        if (tx?.status === "ok") {
          successful++;
          if (successful >= MIN_SUCCESSFUL) {
            // Store every eligible wallet that checks, so you can export the list later.
            if (supabaseUrl && serviceRoleKey) {
              try {
                await fetch(`${supabaseUrl}/rest/v1/eligibility_checks`, {
                  method: "POST",
                  headers: {
                    apikey: serviceRoleKey,
                    Authorization: `Bearer ${serviceRoleKey}`,
                    "Content-Type": "application/json",
                    Prefer: "resolution=merge-duplicates",
                  },
                  body: JSON.stringify({ address: address.toLowerCase(), eligible: true, successful_transactions: successful }),
                });
              } catch (_) {}
            }
            return json({ eligible: true });
          }
        }
      }

      next = data.next_page_params ?? null;
      if (!next || items.length === 0) break;
    }

    if (supabaseUrl && serviceRoleKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/eligibility_checks`, {
          method: "POST",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify({ address: address.toLowerCase(), eligible: false, successful_transactions: successful }),
        });
      } catch (_) {}
    }
    return json({ eligible: false });
  } catch (_) {
    return json({ error: "Unable to check this wallet right now" }, 502);
  }
});
