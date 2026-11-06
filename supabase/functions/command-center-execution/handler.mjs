// An adapter over the existing owner-scoped registries, not a second scheduler.
import { readCompanyBuildPreparation, PreparationReadError, scopedCompanyId } from './preparation-read.mjs';
import { queueOnExistingNormalChatWorker } from './normal-chat-adapter.mjs';
import { requestPcInference, PcInferenceError } from './pc-inference-adapter.mjs';
const ORIGINS = new Set(['https://command-center-preview-alpha.vercel.app', 'https://command-center-preview-crestven-holdings.vercel.app']);
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
class GatewayError extends Error { constructor(code, status = 503) { super(code); this.status = status; } }

export function createExecutionHandler({supabaseUrl, publishableKey, fetcher = fetch, now = () => Date.now()}) {
  const base = new URL(supabaseUrl);
  if (base.protocol !== 'https:' || base.hostname !== 'gmlsucpwliegwlxymjvp.supabase.co') throw Error('Execution backend binding mismatch');
  return async request => {
    const origin = request.headers.get('origin');
    const headers = {'content-type':'application/json', 'cache-control':'no-store', 'vary':'Origin'};
    if (ORIGINS.has(origin)) Object.assign(headers, {'access-control-allow-origin':origin, 'access-control-allow-headers':'authorization,apikey,content-type', 'access-control-allow-methods':'POST,OPTIONS'});
    const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (origin && !ORIGINS.has(origin)) return reply({error:'origin_not_allowed'},403);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'POST') return reply({error:'method_not_allowed'},405);
    const authorization = request.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) return reply({error:'unauthorized'},401);
    const authHeaders = {apikey:publishableKey, authorization, 'content-type':'application/json'};
    async function upstream(path, init = {}) {
      const response = await fetcher(`${base.origin}${path}`, {...init, headers:authHeaders, redirect:'error', cache:'no-store', signal:AbortSignal.timeout(45_000)});
      if (!response.ok) throw new GatewayError('upstream_unavailable');
      return response.json();
    }
    async function rows(table, owner, params) {
      const query = new URLSearchParams({owner_id:`eq.${owner}`, ...params});
      const result = await upstream(`/rest/v1/${table}?${query}`);
      if (!Array.isArray(result)) throw new GatewayError('invalid_canonical_state');
      return result;
    }
    async function invoke(ref, payload) {
      const match = /^supabase-function:([a-z][a-z0-9-]{0,80})$/.exec(ref ?? '');
      if (!match || match[1] === 'command-center-execution') throw new GatewayError('execution_adapter_not_connected');
      // Only same-backend authenticated adapters. Never forward owner credentials to an arbitrary URL.
      return upstream(`/functions/v1/${match[1]}`, {method:'POST', body:JSON.stringify(payload)});
    }
    try {
      let size = 0, text = '';
      const reader = request.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        while (true) {
          const part = await reader.read(); if (part.done) break;
          size += part.value.byteLength;
          if (size > 8192) { await reader.cancel(); throw new GatewayError('body_too_large',413); }
          text += decoder.decode(part.value,{stream:true});
        }
        text += decoder.decode();
      }
      let body; try { body = JSON.parse(text); } catch { throw new GatewayError('invalid_json',400); }
      if (!object(body) || !['agency_start','brain_response','preparation_read'].includes(body.action)) throw new GatewayError('invalid_action',400);
      const user = await upstream('/auth/v1/user');
      if (!user?.id) throw new GatewayError('unauthorized',401);
      const authorized = await upstream('/rest/v1/rpc/is_command_center_authorized',{method:'POST',body:'{}'});
      if (authorized !== true) throw new GatewayError('unauthorized',403);

      if (body.action === 'preparation_read') {
        const result = await readCompanyBuildPreparation(body.projectId, (table, params) => rows(table, user.id, params));
        return reply(result);
      }

      if (body.action === 'agency_start') {
        if (typeof body.projectId !== 'string' || !body.projectId.trim() || body.projectId.length > 240 || typeof body.objective !== 'string' || !body.objective.trim() || body.objective.length > 4000 || !UUID.test(body.requestId ?? '')) throw new GatewayError('invalid_start',400);
        // Existing owner-controlled worker uses an authenticated, durable Supabase
        // queue, not a synchronous Supabase Function executor. Never report a
        // queued task as executed. This branch is STRICTLY for the in-scope 116.
        if (scopedCompanyId(body.projectId)) {
          const receipt = await queueOnExistingNormalChatWorker({
            projectId:body.projectId,objective:body.objective,requestId:body.requestId,
            readRows:(table,params)=>rows(table,user.id,params),
            rpc:(name,payload)=>upstream('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(payload)})
          });
          return reply(receipt,receipt.duplicate?200:202);
        }

        const projects = await rows('command_center_project_profiles',user.id,{project_id:`eq.${body.projectId}`,select:'project_id,type_key',limit:'1'});
        const project = projects[0];
        if (!project) throw new GatewayError('project_not_available',404);
        const executors = await rows('command_center_agency_executors',user.id,{enabled:'eq.true',cost_class:'eq.free',health:'eq.available',retired_at:'is.null',select:'executor_key,executor_ref,project_type_keys,environments,capabilities,authority_class',order:'executor_key.asc',limit:'200'});
        const executor = executors.find(e => Array.isArray(e.project_type_keys) && (!e.project_type_keys.length || e.project_type_keys.includes(project.type_key)) && Array.isArray(e.environments) && e.environments.some(v => ['normal_chat','deterministic'].includes(v)) && Array.isArray(e.capabilities) && e.capabilities.includes('project.execute') && ['read_only','propose','execute_reversible'].includes(e.authority_class));
        if (!executor) throw new GatewayError('no_eligible_executor');
        const roadmaps = await rows('command_center_project_roadmaps',user.id,{project_id:`eq.${body.projectId}`,state:'eq.current',select:'version,structure_verified',limit:'1'});
        const roadmap = roadmaps[0];
        if (!roadmap || roadmap.structure_verified !== true) throw new GatewayError('roadmap_not_verified',409);
        const checkpoints = await rows('command_center_project_checkpoints',user.id,{project_id:`eq.${body.projectId}`,roadmap_version:`eq.${roadmap.version}`,select:'checkpoint_id,exact_next_work_unit_id',order:'created_at.desc',limit:'1'});
        const checkpoint = checkpoints[0];
        if (!checkpoint?.exact_next_work_unit_id) throw new GatewayError('no_next_task',409);
        const readiness = await upstream('/rest/v1/rpc/command_center_project_work_readiness',{method:'POST',body:JSON.stringify({p_project_id:body.projectId,p_roadmap_version:roadmap.version,p_work_unit_id:checkpoint.exact_next_work_unit_id})});
        if (readiness?.ready !== true) throw new GatewayError('next_task_not_ready',409);
        const runId = `agency-run:${body.requestId}`;
        // The adapter owns atomic/idempotent claims and invokes the existing Agency runtime.
        // Never auto-retry this call: a lost response is an uncertain execution, not permission to duplicate it.
        await invoke(executor.executor_ref,{...body,runId,executorKey:executor.executor_key,roadmapVersion:roadmap.version,workUnitId:checkpoint.exact_next_work_unit_id,checkpointId:checkpoint.checkpoint_id,controlMode:"next_step",allowPaid:false,allowProtected:false});
        const runs = await rows('command_center_agency_runs',user.id,{project_id:`eq.${body.projectId}`,run_id:`eq.${runId}`,select:'run_id,state,generation,stop_requested,pause_requested,objective',limit:'1'});
        const run = runs[0];
        if (!run || run.objective !== body.objective.trim() || run.stop_requested || run.pause_requested || run.state !== 'working') throw new GatewayError('execution_not_verified');
        const tasks = await rows('command_center_agency_tasks',user.id,{project_id:`eq.${body.projectId}`,run_id:`eq.${runId}`,state:'eq.working',select:'task_id',limit:'200'});
        const claims = await rows('command_center_agency_task_claims',user.id,{project_id:`eq.${body.projectId}`,status:'eq.claimed',select:'task_id,worker_id,expires_at,heartbeat_at',limit:'200'});
        const claim = claims.find(c => tasks.some(t => t.task_id === c.task_id) && c.worker_id === executor.executor_key && Date.parse(c.expires_at) > now() && Date.parse(c.heartbeat_at) <= now() && now() - Date.parse(c.heartbeat_at) < 60_000);
        if (!claim) throw new GatewayError('execution_not_verified');
        return reply({runId,state:'working',taskId:claim.task_id,executorKey:executor.executor_key});
      }

      if (!UUID.test(body.conversationId ?? '') || !UUID.test(body.ownerTurnId ?? '')) throw new GatewayError('invalid_conversation',400);
      const turns = await rows('command_center_brain_conversation_turns',user.id,{conversation_id:`eq.${body.conversationId}`,turn_id:`eq.${body.ownerTurnId}`,role:'eq.owner',select:'turn_id,project_id',limit:'1'});
      if (!turns.length) throw new GatewayError('conversation_not_available',404);
      const providers = await rows('command_center_provider_registry',user.id,{enabled:'eq.true',cost:'eq.free',health:'eq.available',verification:'eq.live_verified',select:'provider_key,configuration,capabilities,enabled,cost,health,verification,scopes',order:'provider_key.asc',limit:'200'});
      const localProvider = providers.find(p => p.configuration?.gateway_ref === 'supabase:functions:command-center-pc-worker' && p.capabilities?.includes('brain.respond.read_only'));
      if (localProvider) {
        const receipt = await requestPcInference({provider:localProvider,conversationId:body.conversationId,ownerTurnId:body.ownerTurnId,projectId:turns[0].project_id,
          readRows:(table,params)=>rows(table,user.id,params),rpc:(name,payload)=>upstream('/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(payload)})});
        return reply(receipt,receipt.inferenceVerified?200:202);
      }
      const provider = providers.find(p => Array.isArray(p.capabilities) && p.capabilities.includes('brain.respond') && object(p.configuration) && p.configuration.execution_ref);
      if (!provider) throw new GatewayError('no_eligible_inference');
      const result = await invoke(provider.configuration.execution_ref,{...body,projectId:turns[0].project_id,allowPaid:false,canonicalWritesAuthorized:false});
      if (!UUID.test(result?.brainTurnId ?? '')) throw new GatewayError('response_not_verified');
      const responses = await rows('command_center_brain_conversation_turns',user.id,{conversation_id:`eq.${body.conversationId}`,turn_id:`eq.${result.brainTurnId}`,role:'eq.brain',select:'turn_id,project_id,safe_text,redaction_state,canonical_writes_authorized,evidence_refs',limit:'1'});
      const response = responses[0];
      if (!response || response.project_id !== turns[0].project_id || response.redaction_state !== 'safe_text' || !response.safe_text?.trim() || response.canonical_writes_authorized !== false || !response.evidence_refs?.includes(`brain:response-to:${body.ownerTurnId}`)) throw new GatewayError('response_not_verified');
      return reply({brainTurnId:response.turn_id});
    } catch (error) {
      return reply({error:error instanceof GatewayError || error instanceof PreparationReadError || error instanceof PcInferenceError ? error.message : 'execution_unavailable'},error instanceof GatewayError || error instanceof PreparationReadError || error instanceof PcInferenceError ? error.status : 503);
    }
  };
}
