import test from 'node:test';
import assert from 'node:assert/strict';
import {ManagedOwnerRuntimeProvider} from '../dist/runtime/owner-security-provider.js';
const conversationId='11111111-1111-4111-8111-111111111111';
const turnId='22222222-2222-4222-8222-222222222222';
const legacy=['aro','fanvue-veyla','edge-finder','mini-movies','revocapture','loopwren','coupon-autopilot','torevi','velo-clip','crowdskein','margincrafttools'];
function fixture(projectId,change={}) {
 const calls=[];
 const storage={getItem:()=>JSON.stringify({accessToken:'fixture-token',refreshToken:'fixture-refresh',expiresAt:9999999999,userId:'fixture-owner'}),setItem(){},removeItem(){}};
 const fetcher=async(input,init={})=>{
  const url=new URL(String(input));calls.push({url,init});
  let data;
  if(url.pathname.endsWith('/command_center_brain_conversations')){
   assert.equal(url.searchParams.get('owner_id'),'eq.fixture-owner');
   assert.equal(url.searchParams.get('conversation_id'),'eq.'+conversationId);
   data=[{conversation_id:conversationId,project_id:projectId,state:change.conversationState??'active'}];
  } else {
   assert.ok(url.pathname.endsWith('/rpc/command_center_pc_enqueue_inference'));
   const p=JSON.parse(init.body);assert.deepEqual(p,{p_request_id:turnId,p_conversation_id:conversationId,p_owner_turn_id:turnId,p_project_id:projectId});
   assert.equal(init.headers.authorization,'Bearer fixture-token');
   data={request_id:turnId,owner_turn_id:turnId,project_id:projectId,state:'queued',...change.receipt};
  }
  return new Response(JSON.stringify(data),{status:200,headers:{'content-type':'application/json'}});
 };
 const provider=new ManagedOwnerRuntimeProvider({inner:{id:'fixture',async load(){},async signIn(){},async signOut(){}},storage,supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_fixture',fetcher});
 return {provider,calls};
}
test('client queues exact saved owner identity for central and all 128 canonical project IDs; pending never claims a model response',async()=>{
 const projects=[null,...Array.from({length:117},(_,i)=>'project:company:future:'+String(i+1).padStart(3,'0')),...legacy];
 for(const project of projects){const{provider,calls}=fixture(project);const result=await provider.enqueuePcBrainResponse(conversationId,turnId);assert.deepEqual(result,{requestId:turnId,state:'queued'});assert.equal('brainTurnId' in result,false);assert.equal(calls.length,2)}
});
test('client rejects wrong identity, malformed scope and nonactive conversations before trusting a queue receipt',async()=>{
 for(const change of [{receipt:{project_id:'other'}},{receipt:{owner_turn_id:conversationId}},{receipt:{request_id:conversationId}},{receipt:{state:'invented'}},{conversationState:'archived'}]){const{provider}=fixture('aro',change);await assert.rejects(provider.enqueuePcBrainResponse(conversationId,turnId))}
 for(const project of ['../aro','project:company:future:118','company:legacy:aro','ARO']){const{provider,calls}=fixture(project);await assert.rejects(provider.enqueuePcBrainResponse(conversationId,turnId));assert.equal(calls.length,1)}
});
