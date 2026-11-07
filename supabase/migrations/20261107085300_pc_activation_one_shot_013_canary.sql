-- One-shot, activation-only canary for Company 013 on existing paired free local Ollama.
-- Does not create new work, grant general tools, start a company, or change 13 other saved exchanges.
-- Once the exact original queued exchange is claimed, the existing fail-closed guard resumes.
DO $cc_one_shot_canary$
DECLARE original text;
 old_guard constant text := $tag$  if (select count(*) from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state='uncertain') >= 2 then
    return null;
  end if;$tag$;
 new_guard constant text := $tag$  if (select count(*) from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state='uncertain') >= 2 then
    -- A single preexisting, vetted exchange is eligible for one real canary.
    -- After it is claimed, no further exchange is eligible until a separately reviewed change.
    if not exists (select 1 from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker
      and exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid
      and project_id='project:company:future:013' and state='queued' and expires_at>now())
    then return null; end if;
  end if;$tag$;
 old_selector constant text := $tag$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  order by created_at,exchange_id limit 1 for update skip locked;$tag$;
 new_selector constant text := $tag$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  and ((select count(*) from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker and state='uncertain') < 2
       or (exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid and project_id='project:company:future:013'))
  order by created_at,exchange_id limit 1 for update skip locked;$tag$;
BEGIN
 original:=pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
 IF md5(original)<>'83ef3c3a23778b1508d34bf144ab7b8b' THEN
  RAISE EXCEPTION 'Existing RPC source changed; canary migration refused';
 END IF;
 IF length(original)-length(replace(original,old_guard,''))<>length(old_guard) OR
    length(original)-length(replace(original,old_selector,''))<>length(old_selector) THEN
  RAISE EXCEPTION 'Original guard or next selector changed; no deployment';
 END IF;
 IF (select count(*) from public.command_center_pc_activation_exchanges
      where exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid
        and worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
        and project_id='project:company:future:013' and state='queued' and fence=0
        and expires_at>now())<>1 THEN
  RAISE EXCEPTION 'Canonical preexisting Company 013 exchange is no longer queued; no deployment';
 END IF;
 EXECUTE replace(replace(original,old_guard,new_guard),old_selector,new_selector);
END
$cc_one_shot_canary$;
