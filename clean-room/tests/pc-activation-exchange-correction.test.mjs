import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPcLocalOllama} from '../src/brain/pc-local-ollama.mjs';

const modelId='qwen3:4b-instruct';
const modelDigest='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0';
const expectedId='020f6ec9-9405-48c7-9506-ad9e9e32941a';
const schema={type:'object',properties:{exchangeId:{type:'string',enum:[expectedId]},accepted:{type:'boolean'}},
  required:['exchangeId','accepted'],additionalProperties:false};
function fixture(){
 const calls=[],fetcher=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/api/tags'))return{ok:true,json:async()=>({models:[{name:modelId,digest:modelDigest,details:{family:'qwen3'}}]})};
  return{ok:true,json:async()=>({model:modelId,done:true,done_reason:'stop',message:{content:JSON.stringify({exchangeId:expectedId,accepted:true})}})};
 };
 return{calls,model:createPcLocalOllama({modelId,fetcher,timeoutMs:540000})};
}
test('structured activation-only output uses bounded Ollama schema and tokens',async()=>{
 const x=fixture();const r=await x.model.generate({system:'COMMAND CENTER activation',user:'Accept the bounded request',
  json:true,jsonSchema:schema,maxTokens:256,temperature:0});
 assert.equal(r.verifiedInference,true);assert.equal(r.remoteInference,false);
 assert.equal(x.calls.length,3);
 const body=JSON.parse(x.calls[1].options.body);
 assert.equal(body.model,modelId);
 assert.deepEqual(body.format,schema);
 assert.deepEqual(body.options,{temperature:0,num_predict:256});
 assert.equal(body.stream,false);
});
test('ordinary owner inferencing preserves the preexisting non-schema defaults',async()=>{
 const x=fixture();await x.model.generate({system:'Ordinary owner response',user:'Respond'});
 const body=JSON.parse(x.calls[1].options.body);
 assert.equal(Object.hasOwn(body,'format'),false);
 assert.deepEqual(body.options,{temperature:0.2,num_predict:1200});
});
test('invalid schema and excessive token request are rejected before local network access',async()=>{
 const x=fixture();
 await assert.rejects(x.model.generate({system:'x',user:'x',json:true,jsonSchema:[]}),/local_json_schema_invalid/);
 await assert.rejects(x.model.generate({system:'x',user:'x',json:true,jsonSchema:schema,maxTokens:1201}),/local_max_tokens_invalid/);
 await assert.rejects(x.model.generate({system:'x',user:'x',json:true,jsonSchema:schema,temperature:1.1}),/local_temperature_invalid/);
 assert.equal(x.calls.length,0);
});
test('the three-module patch has the exact installed-client baseline and cannot rebuild enrollment',()=>{
 const script=readFileSync(new URL('../evidence/brain-activation/UPDATE_EXISTING_ACTIVATION_LANE_HARDENED.ps1',import.meta.url),'utf8');
 const prior=script.match(/\$before=@'\n([\s\S]*?)\n'@ \| ConvertFrom-Json/);
 const next=script.match(/\$after=@'\n([\s\S]*?)\n'@ \| ConvertFrom-Json/);
 assert.ok(prior&&next);
 const before=JSON.parse(prior[1]),after=JSON.parse(next[1]);
 assert.equal(before.length,16);assert.equal(after.length,3);
 assert.deepEqual(after.map(f=>f.path).sort(),[
  'clean-room/src/worker/pc-worker-cli.mjs','clean-room/src/brain/pc-local-ollama.mjs',
  'clean-room/src/worker/pc-activation-exchange-runner.mjs'].sort());
 assert.match(script,/Stop-ScheduledTask/);
 assert.match(script,/Export-ScheduledTask/);
 assert.match(script,/Start-ScheduledTask/);
 assert.match(script,/Get-FileHash/);
 assert.doesNotMatch(script,/ExecutionPolicy\s+Bypass|Set-ExecutionPolicy|Register-ScheduledTask|Unregister-ScheduledTask|worker-token|token-digest|dpapi|npm install|ollama pull|Invoke-Expression/i);
});
