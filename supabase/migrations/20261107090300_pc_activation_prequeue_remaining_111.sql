-- COMMAND CENTER: queue exactly 111 never-claimed specialist activation exchanges.
-- Bounded, read-only parent-to-specialist acknowledgement; zero spend/no company operations.
-- The already-installed admission guard continues to prevent their execution until separately reviewed.
DO $cc_prequeue_rest$
DECLARE rec record; receipt jsonb; total integer:=0;
BEGIN
 IF (select count(*) from public.command_center_pc_activation_exchanges where state='completed')<>14
  OR (select count(*) from public.command_center_pc_activation_exchanges where state='uncertain')<>3
  OR (select count(*) from public.command_center_pc_activation_exchanges where state='claimed')<>0
  OR (select count(*) from public.command_center_pc_activation_exchanges where state='queued')<>0
  OR (select count(*) from public.command_center_specialist_brains b where not exists
       (select 1 from public.command_center_pc_activation_exchanges x where x.owner_id=b.owner_id and x.project_id=b.project_id and x.brain_version=b.version))<>111
  OR NOT EXISTS(select 1 from public.command_center_pc_worker_registrations
       where worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid
       and enabled and revoked_at is null and last_seen_at>now()-interval '3 minutes')
  OR md5(pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure))<>'97b3247f5921c1ca1031c74484922708'
 THEN RAISE EXCEPTION 'Verified 14/14 proof or exact safe worker/guard conditions changed; no queue changes';
 END IF;
 FOR rec IN
  select b.owner_id,b.project_id from public.command_center_specialist_brains b
  where not exists(select 1 from public.command_center_pc_activation_exchanges x
    where x.owner_id=b.owner_id and x.project_id=b.project_id and x.brain_version=b.version)
  order by b.project_id
 LOOP
   receipt:=public.command_center_pc_queue_activation_exchange_service(
     rec.owner_id,'737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid,rec.project_id,
     'c2d43d16-07e3-4ac6-97cd-8bcf5d7d5f83'::uuid,
     gen_random_uuid(),'evd_owner-command-center-brain-activation-20261105');
   IF receipt->>'state'<>'queued' or receipt->>'duplicate'<>'false'
   THEN RAISE EXCEPTION 'Unexpected queue result, transaction rolled back';END IF;
   total:=total+1;
 END LOOP;
 IF total<>111 THEN RAISE EXCEPTION 'Queue count not 111, transaction rolled back';END IF;
END
$cc_prequeue_rest$;
