-- Nexus Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade, email text, display_name text,
 sampling_rate integer not null default 500,
 alert_thresholds jsonb not null default jsonb_build_object('enabled',true,'metricFilter','ALL','warningThreshold',500,'criticalThreshold',560,'floorThreshold',200,'highlightRows',true,'soundAlert',false),
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create table if not exists public.telemetry (
 id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 "metricName" text not null, value double precision not null, "secondaryValue" double precision, unit text, node text, status text, timestamp text not null,
 "createdAt" timestamptz not null default now(), "updatedAt" timestamptz not null default now()
);
create index if not exists telemetry_user_created_idx on public.telemetry(user_id,"createdAt");
create table if not exists public.api_keys (
 id text primary key, user_id uuid not null references auth.users(id) on delete cascade, name text not null, key text not null, created text not null, "createdAt" timestamptz not null default now()
);
create index if not exists api_keys_user_idx on public.api_keys(user_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new."updatedAt"=now(); return new; end; $$;
drop trigger if exists profiles_set_updated_at on public.profiles; create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists telemetry_set_updated_at on public.telemetry; create trigger telemetry_set_updated_at before update on public.telemetry for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin
 insert into public.profiles(id,email,display_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'displayName',new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name'))
 on conflict(id) do update set email=excluded.email,display_name=coalesce(excluded.display_name,public.profiles.display_name); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users; create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.telemetry enable row level security; alter table public.api_keys enable row level security;
drop policy if exists profiles_select_own on public.profiles; create policy profiles_select_own on public.profiles for select using(auth.uid()=id);
drop policy if exists profiles_insert_own on public.profiles; create policy profiles_insert_own on public.profiles for insert with check(auth.uid()=id);
drop policy if exists profiles_update_own on public.profiles; create policy profiles_update_own on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
drop policy if exists profiles_delete_own on public.profiles; create policy profiles_delete_own on public.profiles for delete using(auth.uid()=id);
drop policy if exists telemetry_select_own on public.telemetry; create policy telemetry_select_own on public.telemetry for select using(auth.uid()=user_id);
drop policy if exists telemetry_insert_own on public.telemetry; create policy telemetry_insert_own on public.telemetry for insert with check(auth.uid()=user_id);
drop policy if exists telemetry_update_own on public.telemetry; create policy telemetry_update_own on public.telemetry for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists telemetry_delete_own on public.telemetry; create policy telemetry_delete_own on public.telemetry for delete using(auth.uid()=user_id);
drop policy if exists api_keys_select_own on public.api_keys; create policy api_keys_select_own on public.api_keys for select using(auth.uid()=user_id);
drop policy if exists api_keys_insert_own on public.api_keys; create policy api_keys_insert_own on public.api_keys for insert with check(auth.uid()=user_id);
drop policy if exists api_keys_update_own on public.api_keys; create policy api_keys_update_own on public.api_keys for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists api_keys_delete_own on public.api_keys; create policy api_keys_delete_own on public.api_keys for delete using(auth.uid()=user_id);

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then execute 'alter publication supabase_realtime add table public.profiles'; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='telemetry') then execute 'alter publication supabase_realtime add table public.telemetry'; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='api_keys') then execute 'alter publication supabase_realtime add table public.api_keys'; end if;
end $$;
