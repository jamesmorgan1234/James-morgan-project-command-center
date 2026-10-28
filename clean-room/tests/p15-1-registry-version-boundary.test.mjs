import test from 'node:test';
import assert from 'node:assert/strict';
import {Registry,ModuleRegistry} from '../dist/kernel/index.js';
test('P15.1 replacement versions reject NaN Infinity fractions and unsafe integers without changing the current record',()=>{
 for(const version of [NaN,Infinity,-Infinity,1.5,Number.MAX_SAFE_INTEGER+1,'2',undefined]){
  const registry=new Registry();registry.register({key:'item',version:1,enabled:true});
  assert.throws(()=>registry.replace({key:'item',version,enabled:false},1),/version/i);
  assert.deepEqual(registry.get('item'),{key:'item',version:1,enabled:true});
 }
 const registry=new Registry();registry.register({key:'item',version:1,enabled:true});registry.replace({key:'item',version:2,enabled:false},1);assert.equal(registry.get('item').version,2);
});
