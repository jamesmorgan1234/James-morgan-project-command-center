-- Activation-only circuit breaker: preserve existing PC, 128 completed proofs, and pending specialist work.
-- Trigger only after >=2 distinct uncertain specialist exchanges for the same paired worker.
-- Does not modify existing queues, cancel work, touch credentials, enable Brains, or affect non-activation calls.
-- Once the error is diagnosed and bounded retry policy verified, a separately reviewed migration
-- may change this guard. Never fake model receipts to make an activation batch appear complete.
DO $cc_activation_guard$
DECLARE
  definition text;
  needle constant text := E'if p_action=\'next\' then\n  update public.command_center_pc_activation_exchanges set state=\'uncertain\'\n  where owner_id=p_owner and worker_id=p_worker and state=\'claimed\' and lease_expires_at<=now();';
  amendment constant text := E'\n  -- Fail closed after repeated uncommitted local specialist exchanges; preserve the queue.\n  if (select count(*) from public.command_center_pc_activation_exchanges\n      where owner_id=p_owner and worker_id=p_worker and state=\'uncertain\') >= 2 then\n    return null;\n  end if;';
BEGIN
  definition := pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(definition) <> 'a99a55abfe23b03f7a379d273a5cd800' THEN
    RAISE EXCEPTION 'Activation exchange service changed; circuit-breaker patch refused without re-review';
  END IF;
  IF position(needle IN definition) = 0 OR
     (length(definition)-length(replace(definition, needle, ''))) <> length(needle) THEN
    RAISE EXCEPTION 'Activation exchange service structure changed; no patch applied';
  END IF;
  EXECUTE replace(definition, needle, needle || amendment);
END
$cc_activation_guard$;
