-- Run once in a new Supabase project's SQL Editor.
-- Public visitors can read ideas and call only the two bounded write functions.
begin;

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  description text not null check (char_length(btrim(description)) between 1 and 1000),
  author_nickname text not null check (char_length(btrim(author_nickname)) between 1 and 40),
  vote_count integer not null default 0 check (vote_count >= 0),
  created_at timestamptz not null default now()
);

create table public.votes (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (idea_id, voter_id)
);
create index ideas_ranking on public.ideas (vote_count desc, created_at desc);
alter table public.ideas enable row level security;
alter table public.votes enable row level security;

revoke all on public.ideas, public.votes from anon, authenticated;
grant select on public.ideas to anon;
create policy "Visitors can read ideas" on public.ideas for select to anon using (true);
-- No votes policies: voter identifiers and direct writes are private.

create function public.submit_idea(p_title text, p_description text, p_nickname text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  insert into public.ideas(title, description, author_nickname)
  values (btrim(p_title), btrim(p_description), btrim(p_nickname)) returning id into new_id;
  return new_id;
end;
$$;

create function public.vote_for_idea(p_idea_id uuid, p_voter_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare inserted_rows integer;
begin
  insert into public.votes(idea_id, voter_id) values (p_idea_id, p_voter_id)
  on conflict (idea_id, voter_id) do nothing;
  get diagnostics inserted_rows = row_count;
  if inserted_rows = 1 then
    update public.ideas set vote_count = vote_count + 1 where id = p_idea_id;
  end if;
  return inserted_rows = 1;
end;
$$;
revoke all on function public.submit_idea(text, text, text) from public, anon, authenticated;
revoke all on function public.vote_for_idea(uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_idea(text, text, text) to anon;
grant execute on function public.vote_for_idea(uuid, uuid) to anon;
commit;
