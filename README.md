# Idea Board

A minimal responsive Next.js App Router + TypeScript application with Supabase PostgreSQL storage. Deploy as a standard Next.js application on Vercel Hobby, subject to the plan's current usage and noncommercial-use terms. No authentication or payments.

## 1. Create Supabase

Create a free Supabase project and wait for provisioning. Save the database password securely. No database password or service-role key is needed by this application.

## 2. Install the schema

Open Supabase → SQL Editor → New query. Paste `supabase/schema.sql` and run it once against a new project. It creates `ideas` and `votes`, enables RLS, and gives the anonymous role read access only to ideas plus execution of two narrow write functions. Direct writes and reading voter identifiers are denied. Functions use a fixed empty search path, qualified table names, and explicit execution grants.

Verify the two tables exist and RLS is enabled. Do not rerun this initial migration against existing tables. Future changes should use separate migrations.

Optional transactional database verification (run after the schema; leaves no test data):

```sql
begin;
set local role anon;
do $$
declare idea uuid; voter uuid := gen_random_uuid(); count_after integer;
begin
  idea := public.submit_idea('Setup check', 'Temporary verification idea', 'Tester');
  if public.vote_for_idea(idea, voter) is distinct from true then
    raise exception 'First vote was not counted';
  end if;
  if public.vote_for_idea(idea, voter) is distinct from false then
    raise exception 'Duplicate vote was accepted';
  end if;
  select vote_count into count_after from public.ideas where id = idea;
  if count_after is distinct from 1 then raise exception 'Incorrect vote count'; end if;
  begin
    perform * from public.votes;
    raise exception 'Vote identifiers are readable';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.ideas set vote_count = 99 where id = idea;
    raise exception 'Direct updates are allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
rollback;
```

Success means no exception and a final ROLLBACK. The primary key `(idea_id, voter_id)` enforces uniqueness, including concurrent requests. The insert and count update run in the same transaction; duplicate requests do not increment the count.

## 3. Configure local environment

Use Node.js 22 or newer (Node 24 recommended).

```sh
cd /workspace/Extracted
npm ci
cp .env.example .env.local
```

Edit `.env.local` with your Supabase Project URL and publishable key from the project's API settings:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

A legacy `anon` key also works. Never use a secret or `service_role` key. These variables have no `NEXT_PUBLIC_` prefix; the Supabase client is protected by `server-only`, and credentials are not sent to the browser. The publishable key is intended for anonymous access; database permissions and RLS enforce its limits even if someone obtains it. Keep `.env.local` out of Git.

## 4. Run and verify

```sh
npm run dev
```

Open the locally running application in your development environment. Submit an idea, reload to confirm persistence, vote once, then vote again. The second attempt should report that you already voted and leave the count unchanged. Confirm the layout works at mobile and desktop widths. Run `npm run build` and `npm run typecheck` before deployment.

The application shows a setup/unavailable state when configuration is missing or the database cannot be read. That state is not evidence that database integration works.

## 5. Deploy to Vercel Hobby

1. Push the application to your GitHub repository's `main` branch, without environment files.
2. In Vercel, add a project and import the repository. Select Next.js, root directory `.`, and Node.js 24.x. Standard build/output settings work unchanged.
3. Add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in Vercel's environment variables. Select Production and only the other environments you intend to connect to that database. Use a separate Supabase project for isolated previews when needed.
4. Deploy. After adding or changing environment variables, redeploy to apply them.
5. Repeat the submit, reload, first-vote, and duplicate-vote checks on the deployed site. Verify that no secret key or `.env.local` file was committed.

No background process, paid add-on, Supabase authentication configuration, or payment integration is required. Supabase free projects may pause when inactive; resume the project if database requests stop working.

## Scope and limitations

A random UUID stored in an HttpOnly, SameSite=Lax cookie identifies a browser for one year. It is not a verified person. Clearing cookies, switching browsers, or calling the public RPC with another UUID can produce another vote. Anonymous nicknames are not verified. There is no abuse prevention, moderation UI, editing, or deletion UI; manage inappropriate content in Supabase. Anonymous submissions and repeated identities can be abused, so add rate limiting/moderation before exposing this to an untrusted large audience. Database constraints prevent duplicate votes for the same identified voter, not multiple identities.

Only the top 100 ideas are loaded, ordered by votes and then newest first. All data access runs on the server and the page is rendered dynamically, so it does not embed a stale board at build time. React renders user content as text.

`package-lock.json` pins installed versions; use `npm ci` to reproduce them. No automated browser or live-database test is included; use the functional checks above with a configured project.

## Codex cloud networking

In this proxy-based cloud environment, start Node with `NODE_USE_ENV_PROXY=1 npm run dev` (or `NODE_USE_ENV_PROXY=1 npm run start` after a build). Node 24 supports the environment proxy flag. Allow your exact Supabase project hostname in cloud network settings. This flag is not required for the standard Vercel deployment.
