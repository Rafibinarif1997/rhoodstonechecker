import { supabase } from "./supabase";

export async function getRhoodPoints(walletAddress) {
  if (!supabase || !walletAddress) {
    return 0;
  }

  const { data, error } = await supabase
    .from("point_transactions")
    .select("amount")
    .eq("wallet_address", walletAddress);

  if (error) {
    console.error("Rhood points lookup failed:", error);
    return 0;
  }

  return (data || []).reduce(
    (total, transaction) =>
      total + Number(transaction.amount || 0),
    0
  );
}
