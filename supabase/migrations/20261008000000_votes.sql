-- Burger poll: votes table, live counts view, RLS and Realtime.

create table if not exists public.votes (
  id         uuid        primary key default gen_random_uuid(),
  burger     text        not null check (burger in ('beef', 'chicken', 'lebanese', 'american')),
  voter_id   text        not null unique,
  created_at timestamptz not null default now()
);

-- Always returns all four options, with 0 for options nobody picked yet.
create or replace view public.vote_counts
with (security_invoker = true) as
select o.burger, count(v.id)::int as count
from (values ('beef'), ('chicken'), ('lebanese'), ('american')) as o(burger)
left join public.votes v on v.burger = o.burger
group by o.burger;

-- Row Level Security: anonymous users can read and insert, nothing else.
alter table public.votes enable row level security;

drop policy if exists "Anyone can read votes" on public.votes;
create policy "Anyone can read votes"
  on public.votes for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can cast a vote" on public.votes;
create policy "Anyone can cast a vote"
  on public.votes for insert
  to anon, authenticated
  with check (true);

-- No UPDATE/DELETE policies exist; also revoke the privileges outright.
revoke update, delete, truncate on public.votes from anon, authenticated;

grant select on public.vote_counts to anon, authenticated;

-- Realtime: broadcast inserts on votes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
