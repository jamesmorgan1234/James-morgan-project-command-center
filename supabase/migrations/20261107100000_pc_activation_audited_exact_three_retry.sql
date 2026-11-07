-- Command Center owner-PC activation only: bounded recovery of three original
-- uncommitted specialist acknowledgements after 125 other canonical receipts verify.
-- No company execution, no new worker/credentials/Task, no spending, no production P15.17/18.
-- Historical uncertain claims are copied into a private, RLS-protected forensic
-- audit table before their own exact exchange IDs become eligible for fenced replay.
DO $cc_recover_exact_three$
DECLARE
  source text; changed text; row record; n integer:=0;
  w constant uuid:='737f5e7c-3884-4c61-81ac-634bdfc4828f'::uuid;
  old_guard constant text:=$old_guard$  if (select count(*) from public.command_center_pc_activation_exchanges
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
  end if;$old_guard$;
  new_guard constant text:=$new_guard$  -- Only the three archived, independently preflighted uncommitted exchanges
  -- may be re-claimed. Stop on even one new expiry or active claim.
  if exists(select 1 from public.command_center_pc_activation_exchanges
      where owner_id=p_owner and worker_id=p_worker and state in ('uncertain','claimed'))
  then return null; end if;$new_guard$;
  old_selector constant text:=$old_selector$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  and ((select count(*) from public.command_center_pc_activation_exchanges
        where owner_id=p_owner and worker_id=p_worker and state='uncertain') < 2
       or (exchange_id in (
        '68ce0972-9183-4694-9310-b36d5f56ede9'::uuid,
        '7cf3662a-0697-41c7-90dd-9f46d35fde36'::uuid,
        '576195be-b381-49d9-b674-cc478427dc8c'::uuid,
        'dcdf10f6-f624-4caf-b3b1-7758d54387c6'::uuid,
        'b3809dcb-c7c6-4282-9e38-2fc6c2c9ff76'::uuid,
        '7ba9a6de-0290-4c2f-882b-5b6b9ff5c0b9'::uuid,
        '2d666091-8996-4d75-926b-ad02c1e5a29a'::uuid,
        '9d0103ec-f35e-4af1-952c-52ccfe00a441'::uuid,
        'c7785d7b-6416-4de4-8940-069daf331a66'::uuid,
        '8bb3de1c-cc2b-4b81-bc9e-2cf00e6e6b3e'::uuid,
        'ad795507-dcef-4de0-9b3a-133a4f869013'::uuid,
        '97e3fce9-33eb-401e-9f5b-3f4f3c0d655d'::uuid,
        'add879b9-3fb6-48ee-9911-2904284244e7'::uuid,
        '8360fa50-267c-42f9-aef6-c06cf01a6383'::uuid,
        '95918f8a-56e8-436c-85c6-19f8d1a4d96c'::uuid,
        'e5f1995c-ff73-43e0-8009-0df4a2e72f9e'::uuid,
        '438327f9-b14b-4682-bfed-f47acdd4929f'::uuid,
        '3970f36b-4d64-4d1f-8ad1-3d7179f53473'::uuid,
        '4de37059-fc7d-4678-85d6-c9ff61899054'::uuid,
        'b60b362c-878d-4af4-a175-ed5e4e262e29'::uuid,
        'fbccfe51-a6cb-48b2-9e4b-40d3c712a8c5'::uuid,
        '160916d9-5089-47d5-8ceb-d8a3c02fa9e3'::uuid,
        '5df202dc-04a7-43a1-b1d4-f8095ef0b39c'::uuid,
        '4f789203-ad2e-4b6d-8cad-e5346f7d0d4c'::uuid,
        '061ccda1-8f8a-4ce7-b10b-d803dd5a46cf'::uuid,
        '09997e51-726b-4928-b57d-a4bfe59644e2'::uuid,
        'aae2390d-72d4-4f53-95e6-f660970eacc3'::uuid,
        'de80f7b6-eb4f-4ad2-a9e7-55998a838030'::uuid,
        '043a4be9-0677-47bb-82af-d0c579c7a682'::uuid,
        '1898d1c2-3d14-4e11-8eaf-6681addb4e77'::uuid,
        '3328af46-40c5-4e45-b5c3-b952c3b5d2f8'::uuid,
        '4c714af1-2694-4db8-a2cb-b1122f8950eb'::uuid,
        'bda53e27-e33b-4bef-9679-6a860383f5c6'::uuid,
        '85032a9f-7be1-4c6a-a98d-66c884d0c0fc'::uuid,
        'a6c4553a-e8e1-4737-9794-bdf993422fe9'::uuid,
        '33da5590-5e5c-47b7-a15e-c9aea0acdb39'::uuid,
        '4949e638-cec6-4de7-8d92-15b83353b95a'::uuid,
        '3ef0c4ef-d1a4-47b3-90ab-552bc435491b'::uuid,
        'e2d87cf9-51d6-434a-bf5c-4c3454c48eda'::uuid,
        'bd108f67-8048-4ae0-90d1-971537ca9560'::uuid,
        'c14aa42f-4487-4f6c-a4e9-167ea8c59423'::uuid,
        '9063049f-cbff-463e-9f4a-ee968843be12'::uuid,
        '70e5f253-bdfa-484c-9b35-aa294ee88af2'::uuid,
        '80c5e867-c48c-43fe-84c3-ecc98a4fe951'::uuid,
        '5d9b2b61-ffed-48cb-877e-b60f4a02c86e'::uuid,
        '024b2f79-7002-47b8-b338-9a2a892f3c97'::uuid,
        '43a65030-6c46-49b6-b22c-a48504187623'::uuid,
        '182c84a8-9cb3-4bc2-9c48-077f3c06d193'::uuid,
        '9d8cd686-2a65-4eaa-82ad-94debd474f36'::uuid,
        '9598bc56-fabe-4fdf-8dba-1766e10f9906'::uuid,
        'fd1bda2d-6283-46af-96fe-9c7ac3308a6a'::uuid,
        'ed1ac126-0282-4836-ad4f-f87a507257fa'::uuid,
        'b25bff50-9c79-4829-80de-fc6b7324cee9'::uuid,
        'b3905e4b-92f4-4398-9cc8-57e5dd079639'::uuid,
        'ad5cdfc8-2b02-4a8b-ab07-b3034dfb9f5d'::uuid,
        'bab8b092-6151-46f6-b2cd-c1ca6f39f639'::uuid,
        'ce087f55-8cf1-400b-927f-57e23bc138d0'::uuid,
        'bbbec149-6a0e-4147-b2cf-2674c64ef8ae'::uuid,
        '75cc9390-0369-4929-8fcc-15d27c72cc7b'::uuid,
        'a1bb7b72-f2c7-48cc-99c4-c7599c2b9059'::uuid,
        '393b003e-10a9-4979-93ad-ad10d3782468'::uuid,
        'ce3ad1b4-0273-4035-8fcb-4f909b8b731f'::uuid,
        '7d78c965-a674-4901-bd76-88de24ef0d45'::uuid,
        '42c6cd95-ce9b-4b8c-a434-2e4d01f1598c'::uuid,
        '83a20cbb-5664-4044-8e71-f0d3ad718f14'::uuid,
        '48830c95-0c42-4044-bba4-068881524329'::uuid,
        '65d65515-6fb7-4792-a3ac-6ddec848a926'::uuid,
        '5b6702be-688d-46a8-a030-6cb7ae8662ec'::uuid,
        '49fa24d3-cb5e-4fb5-b0ff-8e0b84bb8f3f'::uuid,
        '4e9dea4c-39eb-4c27-a21a-0dbd40ec4405'::uuid,
        '9449860e-e119-4716-bc75-1d1fe532aba7'::uuid,
        '650efef1-8335-4a36-8c2f-b276268d74cf'::uuid,
        '2159080f-e7fa-48df-a01d-504b4d6acf47'::uuid,
        '23b04d1b-3c78-4fa8-bd81-69245b267d7b'::uuid,
        '01d7af16-e034-4280-9fa8-b82aeed5a631'::uuid,
        '1dc98416-0ae6-4147-adad-43f79e92a2fc'::uuid,
        '9128ef13-45c8-454e-8bec-a187b938fde1'::uuid,
        '9ff2953b-4fea-47fb-ac57-ad0e8bee8a4d'::uuid,
        '2d763c77-d88b-4c3f-b747-6d44ad0d0ef0'::uuid,
        'daed4034-0e55-4316-b609-e51e80285e73'::uuid,
        '1e031ae0-f522-4ea1-8d97-6ee3a57899d5'::uuid,
        'd290a345-0b08-40ad-af79-6a6f59e40246'::uuid,
        'b6e3cac2-20dd-4026-b69d-123d40cd32bf'::uuid,
        '6b2e30fc-396d-4ace-a5eb-9c66b2cfd9ae'::uuid,
        'bc5891d7-40ed-43a3-bf41-6cbd34143913'::uuid,
        '469f482c-524c-4a9b-85f4-8efe68aadaa3'::uuid,
        '077e0a42-a4f2-4c56-abe9-dbe9306412d2'::uuid,
        '9470859b-00a5-4141-b4ef-304f6e1bce33'::uuid,
        '4df1917c-1177-462f-b6f1-418f428511b3'::uuid,
        '46a99cb6-002d-44fd-b52f-c8e4d2f3a187'::uuid,
        '8c1b908c-c601-4b71-b2ed-f8bb5ab407da'::uuid,
        '20548932-6fe9-4577-84c0-60d4129967b2'::uuid,
        '79c1edb2-8fc8-4f48-9522-fc4c47755509'::uuid,
        '5b1fc739-1fd8-47e4-b143-4e383fd8e865'::uuid,
        '92fd0890-90a8-4b1c-828e-6620fa2ea9dc'::uuid,
        '90e3472e-cbf3-4778-9c50-487ba3eb285d'::uuid,
        'a4f8db47-0c16-419d-b4b4-c60ec9bffca2'::uuid,
        '4a8cd8a4-5caa-4b5d-bcc5-bf51e9fe3f51'::uuid,
        '7ee1e272-4be6-4546-8958-2be5d77d82ca'::uuid,
        '5a3c6bf3-c03e-4a13-bf95-bd9fcd957eda'::uuid,
        '4858a66f-2df5-4ab2-8241-2b2967a2474b'::uuid,
        '009ca91e-3fc9-4ef7-af8f-98dba599f719'::uuid,
        '71298305-4362-4f37-b6f5-fa75ccc228fb'::uuid,
        'bedeaa78-a4ad-48e6-bad4-b80d63ef7a3f'::uuid,
        '94f33ce4-4a28-4e66-8b8a-acefdb80e6ef'::uuid,
        '4e15905d-6135-43a1-b441-7ad4a0169d06'::uuid,
        'eaca0ba2-f88b-42ff-b83b-f215d2351114'::uuid,
        '54a05877-e68e-4012-ae1f-b0f94af2ce2d'::uuid,
        '27fb3e40-b3d0-4309-a4d1-4abb241c1e02'::uuid,
        '2b93eaf7-79c5-408b-bd5a-7dac863f1629'::uuid,
        '71e460c9-7eda-44ab-bae9-35929b9917dc'::uuid
       )))
  order by created_at,exchange_id limit 1 for update skip locked;$old_selector$;
  new_selector constant text:=$new_selector$  where owner_id=p_owner and worker_id=p_worker and state='queued' and expires_at>now()
  and exchange_id=any(array['332601c4-2482-467a-b877-195ab060f60b'::uuid, '295139b4-fdc2-4ea7-88c1-ce64ad2f599e'::uuid, '020f6ec9-9405-48c7-9506-ad9e9e32941a'::uuid])
  order by created_at,exchange_id limit 1 for update skip locked;$new_selector$;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('cc-owner-pc-activation-three-recovery:'||w::text,0));
  source:=pg_get_functiondef('command_center_pc_private.command_center_pc_activation_exchange_service(uuid,uuid,text,uuid,bigint,jsonb)'::regprocedure);
  IF md5(source)<>'7154595cbe3b696ec265b8f758ee5c59'
     OR length(source)-length(replace(source,old_guard,''))<>length(old_guard)
     OR length(source)-length(replace(source,old_selector,''))<>length(old_selector)
  THEN RAISE EXCEPTION 'Exact gateway source changed; no replay'; END IF;

  IF (select count(*) from public.command_center_pc_activation_exchanges)<>128
     OR (select count(*) from public.command_center_pc_activation_exchanges where state='completed')<>125
     OR (select count(*) from public.command_center_pc_activation_exchanges where state='uncertain')<>3
     OR exists(select 1 from public.command_center_pc_activation_exchanges where state in ('queued','claimed'))
     OR (select count(*) from public.command_center_pc_activation_exchanges
            where state='uncertain' and worker_id=w and exchange_id=any(array['332601c4-2482-467a-b877-195ab060f60b'::uuid, '295139b4-fdc2-4ea7-88c1-ce64ad2f599e'::uuid, '020f6ec9-9405-48c7-9506-ad9e9e32941a'::uuid])
              and fence=1 and result is null and commit_id is null and completed_at is null
              and lease_expires_at<now()-interval '30 minutes'
              and expires_at>now()+interval '15 minutes'
              and model_id='qwen3:4b-instruct'
              and expected_model_digest='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0')<>3
     OR (select count(*) from public.command_center_pc_tool_jobs
            where state='completed' and action_key='artifact.write')<>128
     OR (select count(*) from public.command_center_specialist_brains where enabled)<>0
     OR NOT EXISTS(select 1 from public.command_center_pc_worker_registrations
            where worker_id=w and enabled and revoked_at is null
              and last_seen_at>now()-interval '3 minutes')
  THEN RAISE EXCEPTION 'All 125 other specialist proofs or exact three original failures are not safe to replay'; END IF;

  IF (select count(*) from public.command_center_pc_activation_exchanges x
      where x.state='completed' and x.result is not null and x.commit_id is not null
      and x.completed_at is not null and x.fence=1
      and x.result->>'exchangeId'=x.exchange_id::text
      and x.result->>'ownerId'=x.owner_id::text
      and x.result->>'workerId'=x.worker_id::text
      and x.result->>'projectId'=x.project_id
      and x.result->>'companyId'=x.company_id
      and x.result->>'targetBrainKey'=x.brain_key
      and x.result->>'modelId'=x.model_id
      and x.result->>'modelDigest'=x.expected_model_digest
      and x.result->>'inputHash'=x.input_hash
      and x.result->>'fencingToken'=x.fence::text
      and x.result->'companyBuildStarted'='false'::jsonb
      and x.result->'paidUsageAuthorized'='false'::jsonb
      and x.result->'generalToolsExecuted'='false'::jsonb
      and encode(sha256(convert_to(x.result->>'outputText','UTF8')),'hex')=x.result->>'outputHash'
      and (x.result->>'outputText')::jsonb=jsonb_build_object('exchangeId',x.exchange_id,'projectId',x.project_id,'companyId',x.company_id,
          'targetBrainKey',x.brain_key,'nonce',x.nonce,'parentResponseHash',x.parent_response_hash,
          'accepted',true,'companyBuildStarted',false,'paidUsageAuthorized',false)
      and exists(select 1 from public.command_center_brain_conversation_turns t
          where t.turn_id=x.parent_turn_id and t.owner_id=x.owner_id and t.project_id is null
            and t.content_hash=x.parent_response_hash)
     )<>125
  THEN RAISE EXCEPTION 'Completed specialist proof inconsistency; no replay'; END IF;

  EXECUTE 'CREATE TABLE IF NOT EXISTS public.command_center_pc_activation_replay_audit (
     exchange_id uuid NOT NULL,
     original_fence bigint NOT NULL,
     owner_id uuid NOT NULL,
     project_id text NOT NULL,
     previous_state text NOT NULL,
     original_lease_expires_at timestamptz,
     original_row jsonb NOT NULL,
     checkpoint_ref text NOT NULL,
     recorded_at timestamptz NOT NULL DEFAULT now(),
     PRIMARY KEY (exchange_id, original_fence))';
  EXECUTE 'ALTER TABLE public.command_center_pc_activation_replay_audit ENABLE ROW LEVEL SECURITY';
  EXECUTE 'REVOKE ALL ON public.command_center_pc_activation_replay_audit FROM public, anon, authenticated';

  FOR row IN select x.* from public.command_center_pc_activation_exchanges x
       where x.worker_id=w and x.state='uncertain' and x.exchange_id=any(array['332601c4-2482-467a-b877-195ab060f60b'::uuid, '295139b4-fdc2-4ea7-88c1-ce64ad2f599e'::uuid, '020f6ec9-9405-48c7-9506-ad9e9e32941a'::uuid])
       order by x.project_id for update
  LOOP
    insert into public.command_center_pc_activation_replay_audit
       (exchange_id,original_fence,owner_id,project_id,previous_state,original_lease_expires_at,original_row,checkpoint_ref)
       values (row.exchange_id,row.fence,row.owner_id,row.project_id,row.state,row.lease_expires_at,to_jsonb(row),
          'clean-room/evidence/brain-activation/THREE_OLD_UNCERTAIN_REPLAY_PREFLIGHT_20261107.json');
    update public.command_center_pc_activation_exchanges
       set state='queued',lease_expires_at=null
       where exchange_id=row.exchange_id and owner_id=row.owner_id and state='uncertain'
         and fence=row.fence and result is null and commit_id is null;
    IF NOT FOUND THEN RAISE EXCEPTION 'Exact stale claim changed, all changes rolled back'; END IF;
    n:=n+1;
  END LOOP;
  IF n<>3 THEN RAISE EXCEPTION 'Not exactly three original claims; rolled back'; END IF;
  changed:=replace(replace(source,old_guard,new_guard),old_selector,new_selector);
  EXECUTE changed;
END
$cc_recover_exact_three$;
