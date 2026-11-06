begin;
do $preflight$
declare b record;w record;s jsonb;n integer:=0;denied integer:=0;
begin
 select * into strict w from public.command_center_pc_worker_registrations where worker_id='737f5e7c-3884-4c61-81ac-634bdfc4828f';
 for b in select * from public.command_center_specialist_brains where owner_id=w.owner_id order by brain_key loop
  s:=public.command_center_pc_activation_snapshot_service(w.owner_id,w.worker_id,b.project_id);
  if s->>'projectId' is distinct from b.project_id or s->>'brainKey' is distinct from b.brain_key then raise exception 'Positive context identity did not match';end if;
  n:=n+1;
  begin
   perform public.command_center_pc_activation_snapshot_service('00000000-0000-4000-8000-000000000099',w.worker_id,b.project_id);
   raise exception 'Wrong owner unexpectedly received context';
  exception when raise_exception then
   if sqlerrm is distinct from 'Current worker and owner authorization required' then raise;end if;
   denied:=denied+1;
  end;
  begin
   perform public.command_center_pc_activation_snapshot_service(w.owner_id,'00000000-0000-4000-8000-000000000098',b.project_id);
   raise exception 'Unregistered worker unexpectedly received context';
  exception when raise_exception then
   if sqlerrm is distinct from 'Current worker and owner authorization required' then raise;end if;
   denied:=denied+1;
  end;
 end loop;
 perform set_config('cc_activation.permission_preflight',jsonb_build_object('observedAt',now(),'exactProjectContextsRead',n,'wrongOwnerAndWorkerDenials',denied,'changedPersistentRows',false,'scope','live activation context RPC only; not general tool or job execution')::text,true);
end $preflight$;
select current_setting('cc_activation.permission_preflight')::jsonb result;
rollback;
