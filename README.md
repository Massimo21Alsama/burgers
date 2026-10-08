# 🍔 Burger Poll

A live poll: "What's your favourite burger?" Beef, Chicken, Lebanese or American.
Votes appear instantly for everyone through Supabase Realtime.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Realtime) · Vercel

## How it works

- **One vote per browser:** middleware gives each browser a random `voter_id` (`crypto.randomUUID()`) in an httpOnly cookie. Votes go through a server action, and the `unique` constraint on `votes.voter_id` blocks a second vote at the database level. That duplicate error is caught, and the user sees "You've already voted" with the results.
- **Live results:** the results view subscribes to `INSERT` events on `votes`, adds each new vote straight away, and re-fetches the `vote_counts` view shortly after to stay accurate. It unsubscribes on unmount.
- **Results are hidden until you vote.** A "Peek at results" link shows them early.

## Setup

1. **Database:** in your Supabase project, open **SQL Editor** and run
   [`supabase/migrations/20261008000000_votes.sql`](supabase/migrations/20261008000000_votes.sql).
   It creates the `votes` table, the `vote_counts` view, RLS policies (anonymous select + insert only) and turns on Realtime for `votes`.
   (With the Supabase CLI instead: `supabase link` then `supabase db push`.)
2. **Env vars:** copy `.env.example` to `.env.local` and fill in your project values (Supabase → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
   ```
   `.env*` files are git-ignored. Never commit real keys.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build && npm start   # production build
```

To see live updates, open the app in two different browsers (or one normal and one private window), vote in one, and watch the other update.

## Deploy (Vercel)

Import the repo in Vercel (framework preset: Next.js). Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Settings → Environment Variables** for Production (and Preview if you want it), then redeploy. Pushes to `main` deploy to production.

## Resetting the poll

Run `truncate public.votes;` in the Supabase SQL editor.
