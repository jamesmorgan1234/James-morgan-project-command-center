import assert from 'node:assert/strict';
import test from 'node:test';
import {createExecutionHandler} from '../../supabase/functions/command-center-execution/handler.mjs';
import {ManagedOwnerRuntimeProvider} from '../dist/runtime/owner-security-provider.js';
const conversationId='00000000-0000-4000-8000-000000000002',ownerTurnId='00000000-0000-4000-8000-000000000003';
const base='https://gmlsucpwliegwlxymjvp.supabase.co';
const request=body=>new Request(base+'/functions/v1/command-center-execution',{method:'POST',headers:{authorization:'Bearer owner-session','content-type':'application/json'},body:JSON.stringify(body)});

test('existing local provider capability reaches its authenticated queue without arbitrary callback invocation',async()=>{
 const calls=[];let saved=false;
 const workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f';
 const provider={provider_key:'provider:owner-pc:'+workerId,enabled:true,cost:'free',health:'available',verification:'live_verified',capabilities:['brain.respond.read_only'],scopes:['owner-central-brain'],configuration:{worker_id:workerId,model_id:'qwen3:4b-instruct',gateway_ref:'supabase:functions:command-center-pc-worker',execution_mode:'local-ollama',payment_authorized:false,company_build_authorized:false}};
 const fetcher=async(input,init)=>{
  const url=new URL(input);calls.push({url,init});assert.equal(url.origin,base);assert.equal(init.headers.authorization,'Bearer owner-session');
  if(url.pathname==='/auth/v1/user')return Response.json({id:'owner-1'});
  if(url.pathname.endsWith('is_command_center_authorized'))return Response.json(true);
  if(url.pathname.endsWith('command_center_pc_owner_worker_status'))return Response.json([{workerId,enabled:true,online:true,revoked:false}]);
  if(url.pathname.endsWith('command_center_pc_enqueue_inference')){assert.deepEqual(JSON.parse(init.body),{p_request_id:ownerTurnId,p_conversation_id:conversationId,p_owner_turn_id:ownerTurnId,p_project_id:null});saved=true;return Response.json({state:'queued'})}
  assert.equal(url.searchParams.get('owner_id'),'eq.owner-1');
  if(url.pathname.endsWith('command_center_provider_registry'))return Response.json([provider]);
  if(url.pathname.endsWith('command_center_brain_conversation_turns'))return Response.json([{turn_id:ownerTurnId,project_id:null}]);
  if(url.pathname.endsWith('command_center_pc_inference_requests'))return Response.json(saved?[{request_id:ownerTurnId,conversation_id:conversationId,owner_turn_id:ownerTurnId,project_id:null,state:'queued'}]:[]);
  assert.fail('Unexpected route '+url.pathname);
 };
 const handler=createExecutionHandler({supabaseUrl:base,publishableKey:'public-key',fetcher});
 const result=await handler(request({action:'brain_response',conversationId,ownerTurnId}));
 assert.equal(result.status,202);assert.equal((await result.json()).inferenceVerified,false);
 assert.equal(calls.some(c=>c.url.pathname.startsWith('/functions/v1/')),false);
});

test('browser reports local queue as pending and preserves its saved owner turn',async()=>{
 const storage={getItem:()=>JSON.stringify({accessToken:'owner-session',refreshToken:'unused',expiresAt:9999999999,userId:'owner-1'}),setItem(){},removeItem(){}};
 const provider=new ManagedOwnerRuntimeProvider({storage,inner:{id:'test',load:async()=>({}),signIn:async()=>{},signOut:async()=>{}},supabaseUrl:base,publishableKey:'sb_publishable_test',fetcher:async()=>Response.json({requestId:ownerTurnId,state:'queued',inferenceVerified:false,canonicalWritesAuthorized:false},{status:202})});
 await assert.rejects(provider.requestBrainResponse(conversationId,ownerTurnId),/Brain did not confirm a saved response/);
});
