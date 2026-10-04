-- Run once in the selected Supabase project's SQL editor.
create table if not exists public.planner_state (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.planner_state enable row level security;
revoke all on table public.planner_state from anon, authenticated;
grant select on table public.planner_state to authenticated;
drop policy if exists planner_read_own on public.planner_state;
create policy planner_read_own on public.planner_state for select to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.save_planner(expected_revision bigint, planner_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  saved public.planner_state;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if expected_revision < 0 or expected_revision is null
     or planner_data is null
     or pg_catalog.jsonb_typeof(planner_data) <> 'object'
     or pg_catalog.jsonb_typeof(planner_data->'tasks') is distinct from 'array'
     or pg_catalog.jsonb_typeof(planner_data->'notes') is distinct from 'object'
     or pg_catalog.octet_length(planner_data::text) > 2000000 then
    raise exception 'Invalid planner data or size over 2 MB' using errcode = '22023';
  end if;
  if expected_revision = 0 then
    insert into public.planner_state (owner_id, payload, revision)
      values (current_user_id, planner_data, 1)
      on conflict (owner_id) do nothing returning * into saved;
  else
    update public.planner_state set payload = planner_data,
      revision = revision + 1, updated_at = pg_catalog.now()
      where owner_id = current_user_id and revision = expected_revision
      returning * into saved;
  end if;
  if saved.owner_id is not null then
    return pg_catalog.jsonb_build_object('status','ok','revision',saved.revision,'updatedAt',saved.updated_at);
  end if;
  select * into saved from public.planner_state where owner_id = current_user_id;
  return pg_catalog.jsonb_build_object('status','conflict','revision',coalesce(saved.revision,0),'data',saved.payload);
end;
$$;
revoke all on function public.save_planner(bigint,jsonb) from public, anon;
grant execute on function public.save_planner(bigint,jsonb) to authenticated;
