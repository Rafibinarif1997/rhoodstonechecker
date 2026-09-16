import { supabase } from "./supabase";

export async function getRhoodPoints(walletAddress) {
  if (!supabase || !walletAddress) {
    return 0;
  }

  const wallet =
    walletAddress.toLowerCase();

  const { data, error } = await supabase
    .from("point_transactions")
    .select("amount")
    .ilike(
      "wallet_address",
      wallet
    );

  if (error) {
    console.error(
      "Rhood points lookup failed:",
      error
    );

    return 0;
  }

  const total =
    (data || []).reduce(
      (sum, transaction) =>
        sum +
        Number(
          transaction.amount || 0
        ),
      0
    );

  console.log(
    "Rhood Points:",
    total
  );

  return total;
}
