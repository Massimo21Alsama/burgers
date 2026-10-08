"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BURGERS, isBurgerId, type BurgerId, type Counts } from "@/lib/burgers";
import { fetchCounts, getSupabase } from "@/lib/supabase";

type Props = { choice: BurgerId | null };

export default function Results({ choice }: Props) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  // Bars start at 0 and grow once mounted so the first render animates too.
  const [revealed, setRevealed] = useState(false);
  const reconcileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setCounts(await fetchCounts());
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Couldn't load results.");
    }
  }, []);

  useEffect(() => {
    let supabase;
    try {
      supabase = getSupabase();
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    load();

    const channel = supabase
      .channel("votes-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, (payload) => {
        const burger = (payload.new as { burger?: unknown }).burger;
        // Update instantly, then re-sync shortly after in case events overlapped a fetch.
        if (isBurgerId(burger)) {
          setCounts((prev) => (prev ? { ...prev, [burger]: prev[burger] + 1 } : prev));
        }
        if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
        reconcileTimer.current = setTimeout(load, 1500);
      })
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
        // Catch anything missed while (re)connecting.
        if (status === "SUBSCRIBED") load();
      });

    return () => {
      if (reconcileTimer.current) clearTimeout(reconcileTimer.current);
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    if (!counts || revealed) return;
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, [counts, revealed]);

  if (error && !counts) {
    return (
      <div role="alert" className="rounded-3xl bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-900">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null);
            load();
          }}
          className="mt-4 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!counts) {
    return (
      <div aria-busy="true" aria-label="Loading results" className="space-y-3">
        {BURGERS.map((b) => (
          <div key={b.id} className="h-20 animate-pulse rounded-2xl bg-stone-200" />
        ))}
      </div>
    );
  }

  const total = Object.values(counts).reduce((a, n) => a + n, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 id="results-heading" className="text-xl font-bold text-stone-900">
          Results
        </h2>
        <span className="flex items-center gap-2 text-sm font-medium text-stone-600">
          <span
            className={`h-2.5 w-2.5 rounded-full ${live ? "animate-pulse bg-green-600" : "bg-stone-400"}`}
            aria-hidden="true"
          />
          {live ? "Live" : "Connecting…"}
        </span>
      </div>

      {total === 0 && (
        <p className="mb-4 rounded-xl bg-stone-100 px-4 py-3 text-center text-stone-700">
          No votes yet — be the first!
        </p>
      )}

      <ul className="space-y-3" aria-live="polite">
        {BURGERS.map((b) => {
          const count = counts[b.id];
          const pct = total ? Math.round((count / total) * 100) : 0;
          const mine = choice === b.id;
          return (
            <li
              key={b.id}
              className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${mine ? "border-amber-500 ring-2 ring-amber-200" : "border-stone-200"}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-lg font-bold text-stone-900">
                  <span aria-hidden="true">{b.emoji}</span>
                  {b.label}
                  {mine && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      Your pick
                    </span>
                  )}
                </span>
                <span className="text-right tabular-nums text-stone-700">
                  <span className="text-lg font-bold text-stone-900">{pct}%</span>{" "}
                  <span className="text-sm">({count})</span>
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-stone-100"
                role="progressbar"
                aria-label={`${b.label}: ${count} ${count === 1 ? "vote" : "votes"}, ${pct}%`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div
                  className={`h-full rounded-full ${b.bar} transition-[width] duration-700 ease-out motion-reduce:transition-none`}
                  style={{ width: `${revealed ? pct : 0}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-center text-stone-700">
        <span className="font-bold tabular-nums text-stone-900">{total}</span> {total === 1 ? "vote" : "votes"} in total
      </p>
      {error && (
        <p role="alert" className="mt-2 text-center text-sm text-red-800">
          {error} Showing the last known results.
        </p>
      )}
    </div>
  );
}
