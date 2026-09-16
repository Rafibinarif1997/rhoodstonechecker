import { supabase } from "./supabase";

export const RHOODSTONE_CONTRACT =
  "0x6be906e10351b4a970521c386e89d9e4e34c47c9";

export async function checkRhoodStoneHolder(walletAddress) {
  if (!walletAddress) {
    return 0;
  }

  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  console.log("Starting RhoodStone verification...");
  console.log("Wallet:", walletAddress);

  const { data, error } = await supabase.functions.invoke(
    "verify-rhoodstone",
    {
      body: {
        wallet: walletAddress,
      },
    }
  );

  console.log("Edge Function data:", data);
  console.log("Edge Function error:", error);

  if (error) {
    throw new Error(
      `Edge Function error: ${error.message || "Unknown error"}`
    );
  }

  if (!data) {
    throw new Error("No response from verification function");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return Number(data.balance || 0);
}
