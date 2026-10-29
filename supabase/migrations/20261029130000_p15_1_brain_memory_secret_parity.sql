-- P15.1 / RG-022 — align durable Brain-memory secret rejection with the runtime secret-channel guard.
-- Branch-only migration. Committing this file does not mutate production Supabase.
-- This deliberately preserves the existing c6_assert_safe_memory_summary function name so all current callers inherit the stronger boundary.

create or replace function command_center_private.c6_assert_safe_memory_summary(p_summary text,p_content_ref text)
returns void language plpgsql immutable set search_path='' as $$
declare
  v_text text;
begin
  if coalesce(btrim(p_summary),'')='' or coalesce(btrim(p_content_ref),'')='' then
    raise exception 'Brain memory summary and content reference are required';
  end if;

  -- Apply one durable corpus to both stored summary text and content references.
  -- Keep the earlier Supabase/service-role shapes while adding parity with clean-room/src/security/secret-channels.ts.
  foreach v_text in array array[p_summary,p_content_ref] loop
    if v_text ~* '(-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xoxb-[A-Za-z0-9-]{12,}|Bearer[[:space:]]+[A-Za-z0-9._~+/-]{12,}={0,2}|sb_secret_[A-Za-z0-9_-]{10,}|service[_-]?role[^[:space:]]{0,20}[=:][^[:space:]]{8,})' then
      raise exception 'Raw secret material is forbidden in Brain memory';
    end if;

    if v_text ~* '([?&](access_token|refresh_token|token|secret|password|api[_-]?key|client_secret)=)[^&#[:space:]]+' then
      raise exception 'Secret-bearing URL/reference is forbidden in Brain memory';
    end if;

    if v_text ~* 'https?://[^:@/[:space:]]+:[^@/[:space:]]+@' then
      raise exception 'Credential-bearing URL userinfo is forbidden in Brain memory';
    end if;
  end loop;
end $$;

revoke all on function command_center_private.c6_assert_safe_memory_summary(text,text) from public,anon,authenticated;
