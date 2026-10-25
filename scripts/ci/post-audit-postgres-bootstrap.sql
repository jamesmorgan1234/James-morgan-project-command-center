-- Disposable CI-only Supabase platform bootstrap for A11.2 SQL execution proof.
-- This file creates only platform primitives that plain PostgreSQL lacks.
-- It must never be applied to the live Supabase project.

create schema if not exists auth;
create schema if not exists extensions;
create schema if not exists command_center_private;

create extension if not exists pgcrypto with schema extensions;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

create table if not exists auth.users (
  id uuid primary key
);

create or replace function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- The production implementation is provided by the real authorization layer.
-- CI needs only the platform contract so migration DDL/RLS policies can compile.
create or replace function public.is_command_center_authorized()
returns boolean
language sql
stable
set search_path = ''
as $$
  select auth.uid() is not null;
$$;

revoke all on function auth.uid() from public;
revoke all on function public.is_command_center_authorized() from public;
grant execute on function auth.uid() to authenticated;
grant execute on function public.is_command_center_authorized() to authenticated;
