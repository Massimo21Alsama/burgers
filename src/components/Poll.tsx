"use client";

import { useState, useTransition } from "react";
import { castVote } from "@/app/actions";
import { BURGERS, type BurgerId } from "@/lib/burgers";
import Results from "./Results";

type Props = { initialChoice: BurgerId | null; initialError: string | null };

export default function Poll({ initialChoice, initialError }: Props) {
  const [choice, setChoice] = useState<BurgerId | null>(initialChoice);
  const [peeking, setPeeking] = useState(false);
  const [pendingId, setPendingId] = useState<BurgerId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  function vote(id: BurgerId) {
    setError(null);
    setMessage(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await castVote(id);
      if (result.status === "ok") {
        setChoice(result.choice);
      } else if (result.status === "duplicate") {
        setChoice(result.choice ?? id);
        setMessage("You've already voted — here are the results.");
      } else {
        setError(result.message);
      }
      setPendingId(null);
    });
  }

  if (choice || peeking) {
    return (
      <section aria-labelledby="results-heading">
        {message && (
          <p role="status" className="mb-4 rounded-xl bg-amber-100 px-4 py-3 text-center font-medium text-amber-900">
            {message}
          </p>
        )}
        <Results choice={choice} />
        {!choice && (
          <button
            type="button"
            onClick={() => setPeeking(false)}
            className="mt-6 w-full rounded-xl px-4 py-3 font-semibold text-stone-700 underline underline-offset-4 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
          >
            ← Back to voting
          </button>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby="vote-heading">
      <h2 id="vote-heading" className="sr-only">
        Cast your vote
      </h2>
      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-red-100 px-4 py-3 text-center font-medium text-red-900">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:gap-4">
        {BURGERS.map((b) => {
          const loading = pendingId === b.id;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => vote(b.id)}
                disabled={isPending}
                aria-busy={loading}
                aria-label={`Vote for ${b.label}`}
                className="group relative flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <span className="relative text-6xl transition group-hover:scale-110" aria-hidden="true">
                  {b.emoji}
                  <span className="absolute -bottom-1 -right-3 text-2xl">{b.badge}</span>
                </span>
                <span className="text-lg font-bold text-stone-900">{b.label}</span>
                {loading && <span className="text-sm font-medium text-stone-600">Voting…</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => setPeeking(true)}
        disabled={isPending}
        className="mx-auto mt-6 block rounded-lg px-3 py-2 text-sm font-medium text-stone-600 underline underline-offset-4 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        Peek at results
      </button>
    </section>
  );
}
