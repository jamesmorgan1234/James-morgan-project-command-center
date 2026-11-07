-- COMMAND CENTER: extend ONLY activation-exchange claim lease for locally verified, free Ollama inference.
-- Prior device test returned 307.8s (>150s existing lease); model output also mutated a UUID.
-- This never relaxes identity/hash/scope checks and preserves the already deployed uncertainty circuit breaker.
-- Deploy only when the versioned native worker supports a <=600s lease; the current guard blocks new claims.
DO $cc_activation_lease$
DECLARE
  definition text;
  needle constant text := 'now()+interval ''150 seconds''';
  replacement constant text := 'now()+interval ''600 seconds''';
BEGIN
  definition := pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(definition) <> '3c9a75fb2e4cb9b5b7a5fe6932a29376' THEN
    RAISE EXCEPTION 'Activation exchange service changed; lease patch refused';
  END IF;
  IF position('Fail closed after repeated uncommitted local specialist exchanges' in definition)=0
     OR (length(definition)-length(replace(definition,needle,'')))<>length(needle) THEN
    RAISE EXCEPTION 'Guard or exact old lease missing; no migration applied';
  END IF;
  EXECUTE replace(definition,needle,replacement);
END
$cc_activation_lease$;
