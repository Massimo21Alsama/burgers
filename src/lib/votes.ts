import "server-only";
import { isBurgerId, type BurgerId } from "./burgers";
import { getSupabase } from "./supabase";

export async function getVoterChoice(voterId: string): Promise<BurgerId | null> {
  const { data, error } = await getSupabase()
    .from("votes")
    .select("burger")
    .eq("voter_id", voterId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data && isBurgerId(data.burger) ? data.burger : null;
}
