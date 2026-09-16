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

  const { data, error } = await supabase.functions.invoke(
    "verify-rhoodstone",
    {
      body: {
        wallet: walletAddress,
      },
    }
  );

  if (error) {
    console.error("RhoodStone verification error:", error);
    throw error;
  }

  if (!data) {
    throw new Error("No verification response");
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return Number(data.balance || 0);
}
