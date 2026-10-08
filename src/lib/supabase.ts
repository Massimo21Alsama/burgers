import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { emptyCounts, isBurgerId, type Counts } from "./burgers";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function fetchCounts(): Promise<Counts> {
  const { data, error } = await getSupabase().from("vote_counts").select("burger, count");
  if (error) throw new Error(error.message);
  const counts = emptyCounts();
  for (const row of data ?? []) {
    if (isBurgerId(row.burger)) counts[row.burger] = Number(row.count) || 0;
  }
  return counts;
}
