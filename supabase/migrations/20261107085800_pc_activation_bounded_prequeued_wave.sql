-- COMMAND CENTER: continue the 12 previously queued specialist exchange jobs after
-- independent successful corrective canary Company 013. No new queue, no builds,
-- no paid models. At most one claimed job, and fail closed upon any newly uncertain job.
-- The exact 12 IDs below were already queued before this migration.
DO $cc_activation_bounded_wave$
DECLARE
 original text;
 old_guard constant text := $old_guard$  if (select count(*) from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state='uncertain') >= 2 then
    -- A single preexisting, vetted exchange is eligible for one real canary.
    -- After it is claimed, no further exchange is eligible until a separately reviewed change.
    if not exists (select 1 from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker
      and exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid
      and project_id='project:company:future:013' and state='queued' and expires_at>now())
    then return null; end if;
  end if;$old_guard$;
 new_guard constant text := $new_guard$  if (select count(*) from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state='uncertain') >= 2 then
    -- Three earlier failures are preserved, and the corrective canary must have
    -- a canonical result. Stop immediately on any new failure or in-flight claim.
    if (select count(*) from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state='uncertain') <> 3
      or not exists (select 1 from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker
        and exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid
        and project_id='project:company:future:013' and state='completed'
        and commit_id is not null and completed_at is not null
        and result->>'modelDigest'='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0')
      or exists (select 1 from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker and state='claimed')
    then return null; end if;
  end if;$new_guard$;
 old_selector constant text := $old_selector$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  and ((select count(*) from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker and state='uncertain') < 2
       or (exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid and project_id='project:company:future:013'))
  order by created_at,exchange_id limit 1 for update skip locked;$old_selector$;
 new_selector constant text := $new_selector$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  and ((select count(*) from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker and state='uncertain') < 2
       or (exchange_id in (
        '4fe3d996-5533-4352-bfaf-526b6ff8337d'::uuid,
        '52e3d4e3-c261-41c4-bf24-6dabd9bca9b1'::uuid,
        '65321daf-c332-42a5-97cb-9e71ef33a67f'::uuid,
        '70d9165f-06a3-4c27-ac35-7a7005d7022c'::uuid,
        'bf8e55b3-7ae6-4838-b7ef-4f880045f72c'::uuid,
        'd11addeb-171a-445f-833c-10a5ba68112f'::uuid,
        'd859b4d1-3cde-424d-9f82-919e64ae24fe'::uuid,
        'dc00733a-63ed-4eb3-857f-ed07bfbcbc20'::uuid,
        'ddf6827a-f389-4aa8-8424-b72851a73650'::uuid,
        'df4dc833-d319-490a-9a2f-fa4d53d066ae'::uuid,
        'ea54a26e-7801-47cb-a7da-2d025fb47f3b'::uuid,
        'ff9d5e72-4425-4064-9ef3-4cde383d90df'::uuid
       )))
  order by created_at,exchange_id limit 1 for update skip locked;$new_selector$;
BEGIN
 original:=pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
 IF md5(original)<>'a9e537aa0082426db72979de4e6d062d' THEN
  RAISE EXCEPTION 'RPC source changed, wave not deployed';
 END IF;
 IF length(original)-length(replace(original,old_guard,''))<>length(old_guard)
    OR length(original)-length(replace(original,old_selector,''))<>length(old_selector) THEN
   RAISE EXCEPTION 'Cannot identify exact one-shot guard and selector';
 END IF;
 IF (select count(*) from public.command_center_pc_activation_exchanges
       where state='uncertain' and worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid)<>3
    OR exists(select 1 from public.command_center_pc_activation_exchanges
       where state='claimed' and worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid)
    OR NOT exists (select 1 from public.command_center_pc_activation_exchanges
       where exchange_id='8223bb84-fdbc-4030-9e76-a05041d0a3ca'::uuid
       and state='completed' and commit_id is not null and completed_at is not null
       and project_id='project:company:future:013'
       and result->>'modelDigest'='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0')
    OR (select count(*) from public.command_center_pc_activation_exchanges
       where state='queued' and worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
       and exchange_id=ANY(ARRAY[
        '4fe3d996-5533-4352-bfaf-526b6ff8337d'::uuid,
        '52e3d4e3-c261-41c4-bf24-6dabd9bca9b1'::uuid,
        '65321daf-c332-42a5-97cb-9e71ef33a67f'::uuid,
        '70d9165f-06a3-4c27-ac35-7a7005d7022c'::uuid,
        'bf8e55b3-7ae6-4838-b7ef-4f880045f72c'::uuid,
        'd11addeb-171a-445f-833c-10a5ba68112f'::uuid,
        'd859b4d1-3cde-424d-9f82-919e64ae24fe'::uuid,
        'dc00733a-63ed-4eb3-857f-ed07bfbcbc20'::uuid,
        'ddf6827a-f389-4aa8-8424-b72851a73650'::uuid,
        'df4dc833-d319-490a-9a2f-fa4d53d066ae'::uuid,
        'ea54a26e-7801-47cb-a7da-2d025fb47f3b'::uuid,
        'ff9d5e72-4425-4064-9ef3-4cde383d90df'::uuid
       ]))<>12
 THEN RAISE EXCEPTION 'Canary proof, exclusive worker or 12 prequeued exchanges differ; no change';
 END IF;
 EXECUTE replace(replace(original,old_guard,new_guard),old_selector,new_selector);
END
$cc_activation_bounded_wave$;
