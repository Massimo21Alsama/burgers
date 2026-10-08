"use server";

import { cookies } from "next/headers";
import { isBurgerId, VOTER_COOKIE, type BurgerId } from "@/lib/burgers";
import { getSupabase } from "@/lib/supabase";
import { getVoterChoice } from "@/lib/votes";

export type VoteResult =
  | { status: "ok"; choice: BurgerId }
  | { status: "duplicate"; choice: BurgerId | null }
  | { status: "error"; message: string };

export async function castVote(burger: string): Promise<VoteResult> {
  if (!isBurgerId(burger)) return { status: "error", message: "That isn't one of the options." };

  const voterId = (await cookies()).get(VOTER_COOKIE)?.value;
  if (!voterId) {
    return { status: "error", message: "We couldn't identify your browser. Please enable cookies and reload." };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("votes").insert({ burger, voter_id: voterId });
    if (!error) return { status: "ok", choice: burger };

    // 23505 = unique_violation on voter_id: this browser already voted.
    if (error.code === "23505") {
      return { status: "duplicate", choice: await getVoterChoice(voterId) };
    }
    console.error("Vote insert failed", error);
    return { status: "error", message: "Your vote didn't go through. Please try again." };
  } catch (err) {
    console.error("Vote failed", err);
    return { status: "error", message: "Your vote didn't go through. Please try again." };
  }
}
