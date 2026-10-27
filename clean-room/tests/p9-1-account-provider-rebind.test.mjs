import test from 'node:test';
import assert from 'node:assert/strict';
import {FinancialAccountRegistry,FinancialProviderRegistry,assessFinancialProviderConnection} from '../dist/finance/index.js';
const account={id:'account:one',ownerId:'owner',providerKey:'finance-provider:old',externalAccountId:'old-id',displayName:'Checking',type:'checking',balance:{state:'known',cents:0,currency:'USD'},balanceAsOf:'2026-10-27T12:00:00Z',liability:false,sourceRef:'balance:old',version:1};
const provider={key:'finance-provider:new',version:1,enabled:true,connectionState:'connected',consentState:'granted',capabilities:['accounts.read'],dataScopes:['company:one/project:one'],freshnessSeconds:300,health:'available',credentialRef:'secret-ref:never-copy'};
const request={operationId:'rebind:one',accountId:account.id,ownerId:'owner',expectedVersion:1,provider,externalAccountId:'new-id',requiredReadScope:'company:one/project:one',consentRef:'consent:explicit',sourceRef:'reconnect:verified'};
function setup(){const r=new FinancialAccountRegistry();r.register(account);return r;}
test('rebind preserves canonical identity financial truth and immutable provider lineage',()=>{
 const r=setup();r.rebindProvider(request);
 assert.deepEqual(r.get(account.id),{...account,providerKey:provider.key,externalAccountId:'new-id',version:2});
 assert.deepEqual(r.providerLineage(account.id).map(x=>x.providerKey),[account.providerKey,provider.key]);
 assert.equal(r.providerLineage(account.id)[0].sourceRef,'balance:old');
 assert.equal(r.providerLineage(account.id)[1].sourceRef,'reconnect:verified');
 assert.throws(()=>{r.providerLineage(account.id)[0].providerKey='changed';},TypeError);
 assert.throws(()=>r.replace({...r.get(account.id),providerKey:'different',version:3},2), /canonical identity/);
});
test('exact replay is idempotent and operation-id reuse with different identity fails closed',()=>{
 const r=setup();const receipt=r.rebindProvider(request);assert.equal(r.rebindProvider(request),receipt);
 assert.equal(r.get(account.id).version,2);assert.equal(r.providerLineage(account.id).length,2);
 assert.throws(()=>r.rebindProvider({...request,externalAccountId:'different'}), /operation identity collision/);
});
test('target collisions and historical alias duplicate registration cannot split canonical accounts',()=>{
 const r=setup();r.register({...account,id:'account:two',providerKey:provider.key,externalAccountId:'collision'});
 assert.throws(()=>r.rebindProvider({...request,externalAccountId:'collision'}), /identity collision/);
 assert.equal(r.get(account.id).version,1);assert.equal(r.providerLineage(account.id).length,1);
 r.rebindProvider(request);
 assert.throws(()=>r.register({...account,id:'account:duplicate-old'}), /Duplicate/);
 assert.throws(()=>r.register({...account,id:'account:duplicate-new',providerKey:provider.key,externalAccountId:'new-id'}), /Duplicate/);
});
test('read rebind grants no action capability and copies no credential material',()=>{
 const r=setup();const providers=new FinancialProviderRegistry();providers.register(provider);
 const receipt=r.rebindProvider(request);assert.equal(receipt.protectedActionAuthorized,false);
 assert.equal(providers.eligible('payment.write').length,0);assert.equal(providers.eligible('transfer.write').length,0);
 assert.deepEqual(providers.get(provider.key).dataScopes,provider.dataScopes);
 assert.equal(JSON.stringify([r.get(account.id),r.providerLineage(account.id),receipt]).includes('never-copy'),false);
});
test('provider loss or degradation and missing consent/scope cannot mutate canonical state',()=>{
 const r=setup();
 for(const changes of [{health:'unavailable'},{health:'degraded'},{connectionState:'disconnected'},{consentState:'revoked'},{enabled:false},{capabilities:[]},{dataScopes:[]}]) assert.throws(()=>r.rebindProvider({...request,provider:{...provider,...changes}}), /read connection/);
 assert.throws(()=>r.rebindProvider({...request,consentRef:''}), /explicit/);
 assert.equal(r.get(account.id).version,1);assert.equal(r.providerLineage(account.id).length,1);
 const disconnected=assessFinancialProviderConnection({providerKey:account.providerKey,ownerId:account.ownerId,providerIdentity:'institution:one',connectionState:'disconnected',consentState:'granted',consentRef:'consent:old',reconnectRef:'reconnect:needed',observedAt:account.balanceAsOf,freshnessSeconds:300,provenanceRefs:['disconnect:one']},account.balanceAsOf);
 assert.equal(disconnected.historicalRecordsPreserved,true);assert.deepEqual(r.get(account.id),account);
 r.rebindProvider(request);assert.equal(r.get(account.id).id,account.id);
});
test('owner mismatch stale versions and secret-bearing metadata fail before mutation',()=>{
 const r=setup();
 assert.throws(()=>r.rebindProvider({...request,ownerId:'other'}), /owner mismatch/);
 assert.throws(()=>r.rebindProvider({...request,expectedVersion:9}), /version conflict/);
 assert.throws(()=>r.rebindProvider({...request,sourceRef:'Bearer '+ 'a'.repeat(24)}), /Secret/);
 assert.deepEqual(r.get(account.id),account);
});
