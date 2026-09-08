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
    headers: {...cors, "Content-Type": "application/json"},
  });
}

function validAddress(a: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(a);
}

async function isEligible(address: string, key: string) {
  let count = 0;
  let next: Record<string, string | number> | null = null;

  for (let page = 0; page < 100; page++) {
    const url = new URL(`${BLOCKSCOUT_BASE}/addresses/${address}/transactions`);
    url.searchParams.set("filter", "from");
    if (next) for (const [k,v] of Object.entries(next)) url.searchParams.set(k,String(v));

    const r = await fetch(url.toString(), {
      headers: {Authorization: `Bearer ${key}`},
    });
    if (!r.ok) throw new Error(`Blockscout error ${r.status}`);

    const data = await r.json();
    const items = Array.isArray(data.items) ? data.items : [];

    for (const tx of items) {
      if (tx?.status === "ok") {
        count++;
        if (count >= MIN_SUCCESSFUL) return true;
      }
    }

    next = data.next_page_params ?? null;
    if (!next || items.length === 0) break;
  }
  return false;
}

async function saveAddress(address: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) throw new Error("Supabase database is not configured");

  const r = await fetch(`${url}/rest/v1/eligibility_checks`, {
    method:"POST",
    headers:{
      apikey:service,
      Authorization:`Bearer ${service}`,
      "Content-Type":"application/json",
      Prefer:"resolution=merge-duplicates,return=minimal"
    },
    body:JSON.stringify({
      address:address.toLowerCase(),
      eligible:true,
      successful_transactions:MIN_SUCCESSFUL
    })
  });
  if (!r.ok) throw new Error("Could not save address");
}

Deno.serve(async req => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);

  const key=Deno.env.get("BLOCKSCOUT_API_KEY");
  if(!key) return json({error:"Server is not configured"},500);

  let body:any;
  try{body=await req.json()}catch{return json({error:"Invalid JSON"},400)}

  const address=String(body.address||"").trim();
  const action=String(body.action||"check");
  if(!validAddress(address)) return json({error:"Invalid wallet address"},400);
  if(action!=="check" && action!=="submit") return json({error:"Invalid action"},400);

  try{
    const eligible=await isEligible(address,key);
    if(!eligible) return json({eligible:false,submitted:false});

    if(action==="submit"){
      await saveAddress(address);
      return json({eligible:true,submitted:true});
    }
    return json({eligible:true,submitted:false});
  }catch(e){
    console.error(e);
    return json({error:"Unable to check this wallet right now"},502);
  }
});
