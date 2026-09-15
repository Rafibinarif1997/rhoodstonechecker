import { supabase } from "./supabase";

export async function getHolderTier(points = 0, holdingDays = 0) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("holder_tiers")
    .select("name, min_points, min_holding_days")
    .order("min_points", { ascending: false });

  if (error) {
    console.error("Holder tier lookup failed:", error);
    return null;
  }

  const matchingTier = data.find(
    (tier) =>
      points >= tier.min_points &&
      holdingDays >= tier.min_holding_days
  );

  return matchingTier || null;
}
