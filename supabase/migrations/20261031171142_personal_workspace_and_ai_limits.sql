create schema if not exists aura_private;
revoke all on schema aura_private from public;
grant usage on schema aura_private to authenticated;
create table public.complete_days(user_id uuid not null references auth.users(id) on delete cascade, day date not null, primary key(user_id,day));
alter table public.complete_days enable row level security;
create policy complete_days_owner on public.complete_days for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.complete_days to authenticated;
create table aura_private.ai_usage(user_id uuid primary key references auth.users(id) on delete cascade, window_start timestamptz not null, requests integer not null);
alter table aura_private.ai_usage enable row level security;
revoke all on aura_private.ai_usage from public,anon,authenticated;
create function aura_private.consume_ai_request() returns boolean language plpgsql security definer set search_path='' as $$
declare actor uuid := auth.uid(); total integer;
begin
 if actor is null then raise exception 'Authentication required'; end if;
 insert into aura_private.ai_usage(user_id,window_start,requests) values(actor,date_trunc('hour',now()),1)
 on conflict(user_id) do update set
 requests=case when aura_private.ai_usage.window_start=date_trunc('hour',now()) then aura_private.ai_usage.requests+1 else 1 end,
 window_start=date_trunc('hour',now())
 returning requests into total;
 return total<=60;
end $$;
revoke all on function aura_private.consume_ai_request() from public,anon;
grant execute on function aura_private.consume_ai_request() to authenticated;
create function public.consume_ai_request() returns boolean language sql security invoker set search_path='' as $$ select aura_private.consume_ai_request(); $$;
revoke all on function public.consume_ai_request() from public,anon;
grant execute on function public.consume_ai_request() to authenticated;
revoke execute on function public.new_user_profile() from public,anon,authenticated;
