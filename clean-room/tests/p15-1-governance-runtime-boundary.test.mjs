import test from 'node:test';import assert from 'node:assert/strict';import {evaluateGovernance,GovernanceGate} from '../dist/kernel/index.js';
const base=()=>({ownerId:'owner:james',authorityOwnerId:'owner:james',newestInstructionAllows:true,instructionState:'current',freeFirst:true,introducesCost:false,action:'read',executionSurface:'normal_chat',normalChatAvailable:true,now:'2026-10-28T00:00:00Z'});
test('P15.1 ambiguous owner governance flags cannot become execution authority through truthiness',()=>{
 assert.equal(evaluateGovernance(base()).allowed,true);
 for(const [field,values] of Object.entries({newestInstructionAllows:['false',1,null,undefined],freeFirst:['false',0,null,undefined],introducesCost:['false',0,null,undefined]}))for(const value of values){
  const input={...base(),[field]:value};assert.equal(evaluateGovernance(input).allowed,false,field+':'+String(value));
  let calls=0;assert.throws(()=>new GovernanceGate().execute(input,()=>calls++));assert.equal(calls,0);
 }
});
test('P15.1 unknown governance instruction or surface and blank owner fail closed while optional defaults remain compatible',()=>{
 for(const patch of [{instructionState:'unknown'},{instructionState:null},{executionSurface:'worker'},{executionSurface:null},{ownerId:''},{ownerId:'  '},{authorityOwnerId:42},{normalChatAvailable:'false'}])assert.equal(evaluateGovernance({...base(),...patch}).allowed,false,JSON.stringify(patch));
 const defaults=base();delete defaults.instructionState;delete defaults.executionSurface;delete defaults.normalChatAvailable;assert.equal(evaluateGovernance(defaults).allowed,true);
});
test('P15.1 exported action classifications cannot be mutated into an authorization bypass',async()=>{
 const {PROTECTED_ACTIONS,NON_PROTECTED_ACTIONS}=await import('../dist/kernel/index.js');
 const protectedBefore=[...PROTECTED_ACTIONS],nonProtectedBefore=[...NON_PROTECTED_ACTIONS];
 try{
  try{PROTECTED_ACTIONS.splice(PROTECTED_ACTIONS.indexOf('deploy_production'),1);}catch(error){assert.ok(error instanceof TypeError);}
  try{NON_PROTECTED_ACTIONS.push('deploy_production');}catch(error){assert.ok(error instanceof TypeError);}
  assert.equal(evaluateGovernance({...base(),action:'deploy_production'}).allowed,false);
  assert.ok(Object.isFrozen(PROTECTED_ACTIONS));assert.ok(Object.isFrozen(NON_PROTECTED_ACTIONS));
 }finally{
  if(!Object.isFrozen(PROTECTED_ACTIONS))PROTECTED_ACTIONS.splice(0,PROTECTED_ACTIONS.length,...protectedBefore);
  if(!Object.isFrozen(NON_PROTECTED_ACTIONS))NON_PROTECTED_ACTIONS.splice(0,NON_PROTECTED_ACTIONS.length,...nonProtectedBefore);
 }
});
test('P15.1 malformed authorization timestamps return a denied decision without executing operations',()=>{
 const authorized={...base(),action:'merge',authorization:{ownerId:'owner:james',action:'merge',authorizedAt:'2026-10-27T23:59:00Z',expiresAt:'2026-10-28T00:01:00Z'}};
 assert.equal(evaluateGovernance(authorized).allowed,true);
 for(const invalid of [{...authorized,now:0},{...authorized,authorization:{...authorized.authorization,authorizedAt:null}},{...authorized,authorization:{...authorized.authorization,expiresAt:42}}]){
  assert.equal(evaluateGovernance(invalid).allowed,false);let calls=0;assert.throws(()=>new GovernanceGate().execute(invalid,()=>calls++));assert.equal(calls,0);
 }
});