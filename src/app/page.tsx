import { cookies } from "next/headers";
import Poll from "@/components/Poll";
import { VOTER_COOKIE, type BurgerId } from "@/lib/burgers";
import { getVoterChoice } from "@/lib/votes";

export const dynamic = "force-dynamic";

export default async function Home() {
  const voterId = (await cookies()).get(VOTER_COOKIE)?.value;

  let initialChoice: BurgerId | null = null;
  let loadError: string | null = null;
  if (voterId) {
    try {
      initialChoice = await getVoterChoice(voterId);
    } catch (err) {
      console.error("Couldn't load existing vote", err);
      loadError = "We couldn't reach the poll right now. You can still try voting.";
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-8 sm:py-12">
      <header className="mb-6 text-center">
        <p className="text-5xl" aria-hidden="true">🍔</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-900">
          What&apos;s your favourite burger?
        </h1>
        <p className="mt-1 text-stone-600">One vote per person. Results update live.</p>
      </header>
      <Poll initialChoice={initialChoice} initialError={loadError} />
    </main>
  );
}
