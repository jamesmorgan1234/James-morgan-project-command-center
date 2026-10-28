import test from 'node:test';
import assert from 'node:assert/strict';
import {SupabaseOwnerRuntimeSnapshotProvider} from '../dist/runtime/supabase-owner-provider.js';
import {providerFromDocument} from '../dist/runtime/provider.js';
const KEY='command-center:owner-session:v1';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status});
class MemoryStorage{
 values=new Map();writes=0;
 getItem(k){return this.values.get(k)??null;}setItem(k,v){this.values.set(k,v);this.writes++;}removeItem(k){this.values.delete(k);}
}
const valid=()=>({accessToken:'synthetic-access',refreshToken:'synthetic-refresh',expiresAt:Math.floor(Date.now()/1000)+3600,userId:'synthetic-owner'});
function fixture({storage=new MemoryStorage(),refresh=()=>json({error:'expired'},401),prompt,requestTimeoutMs}={}){
 const calls=[];const fetcher=async(input,init)=>{
  const url=new URL(String(input));calls.push({url,init});
  assert.equal(init.cache,'no-store');
  if(url.pathname==='/auth/v1/token'){
   if(url.searchParams.get('grant_type')==='refresh_token')return refresh();
   return json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:valid().expiresAt,user:{id:'synthetic-owner'}});
  }
  if(url.pathname.endsWith('/cc7_owner_access'))return json([{enabled:true}]);
  if(url.pathname.startsWith('/rest/v1/')){assert.equal(url.searchParams.get('owner_id'),'eq.synthetic-owner');return json([]);}
  if(url.pathname==='/auth/v1/logout')return json({});
  throw Error('Unexpected synthetic request');
 };
 const provider=new SupabaseOwnerRuntimeSnapshotProvider({supabaseUrl:'https://isolated-session.example.invalid',publishableKey:'sb_publishable_synthetic',storage,fetcher,...(prompt?{promptForCredentials:prompt}:{}),...(requestTimeoutMs?{requestTimeoutMs}:{})});
 return{provider,calls,storage};
}

test('P15.1 valid session survives a fresh provider instance without duplicate authentication',async()=>{
 const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify(valid()));
 const first=fixture({storage});assert.equal((await first.provider.load()).connection.state,'connected');
 const reopened=fixture({storage});assert.equal((await reopened.provider.load()).connection.state,'connected');
 assert.equal(reopened.calls.filter(c=>c.url.pathname.startsWith('/auth/')).length,0);assert.equal(storage.values.size,1);
});

test('P15.1 fresh PWA document restores only through the same-origin broker and canonical authorization',async()=>{
 const original=globalThis.fetch,previousDocument=globalThis.document,calls=[];
 const document={baseURI:'https://isolated-pwa.vercel.app/',querySelector(s){const values={'meta[name="command-center-supabase-url"]':'https://isolated-session.example.invalid','meta[name="command-center-supabase-publishable-key"]':'sb_publishable_synthetic'};return values[s]?{content:values[s]}:null;}};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input));calls.push({url,init});assert.equal(init.cache,'no-store');
  if(url.pathname==='/api/owner-session'){
   assert.equal(url.origin,'https://isolated-pwa.vercel.app');assert.deepEqual(JSON.parse(init.body),{action:'refresh'});assert.equal(init.credentials,'same-origin');
   return json({access_token:'synthetic-access',expires_at:valid().expiresAt,user:{id:'synthetic-owner'}});
  }
  if(url.pathname.endsWith('/rpc/command_center_touch_current_session'))return json('synthetic-canonical-session');
  if(url.pathname.endsWith('/cc7_owner_access'))return json([{enabled:true}]);
  if(url.pathname.startsWith('/rest/v1/'))return json([]);
  throw Error('Unexpected synthetic request');
 };
 globalThis.document=document;
 try{
  assert.equal((await providerFromDocument(document).load()).connection.state,'connected');
  assert.equal((await providerFromDocument(document).load()).connection.state,'connected');
  assert.equal(calls.filter(c=>c.url.pathname==='/api/owner-session').length,2);
  assert.equal(calls.filter(c=>c.url.pathname.endsWith('/cc7_owner_access')).length,2);
  assert.equal(calls.some(c=>c.url.pathname.includes('/auth/v1/token')),false);
 }finally{await new Promise(r=>setTimeout(r,10));globalThis.fetch=original;if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;}
});

test('P15.1 expired refresh returns to authentication and successful retry resumes without frozen state',async()=>{
 const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify({...valid(),expiresAt:1}));let prompts=0;
 const f=fixture({storage,prompt:async submit=>{prompts++;assert.equal(storage.getItem(KEY),null);await submit('owner@example.invalid','synthetic');}});
 const result=await f.provider.load();assert.equal(result.connection.state,'connected');assert.equal(prompts,1);
 assert.equal(f.calls.filter(c=>c.url.searchParams.get('grant_type')==='refresh_token').length,1);
 assert.equal(f.calls.filter(c=>c.url.searchParams.get('grant_type')==='password').length,1);
});

test('P15.1 zero expiry never authorizes data when broker refresh is rejected',async()=>{
 const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify({...valid(),expiresAt:0}));const f=fixture({storage});
 const snapshot=await f.provider.load();assert.equal(snapshot.connection.state,'disconnected');assert.equal(snapshot.projects.length,0);
 assert.equal(storage.getItem(KEY),null);assert.equal(f.calls.filter(c=>c.url.searchParams.get('grant_type')==='refresh_token').length,1);
 assert.equal(f.calls.some(c=>c.url.pathname.startsWith('/rest/')),false);
});

test('P15.1 expired session with provider outage cannot load private data and later retry recovers',async()=>{
 const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify({...valid(),expiresAt:1}));let failed=true;
 const f=fixture({storage,refresh:()=>{if(failed)throw Error('synthetic outage');return json({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_at:valid().expiresAt,user:{id:'synthetic-owner'}});}});
 const result=await f.provider.load();assert.equal(result.connection.state,'disconnected');assert.equal(result.projects.length,0);assert.match(result.connection.message,/sign-in is required/i);
 assert.equal(f.calls.some(c=>c.url.pathname.startsWith('/rest/')),false);
 failed=false;assert.equal((await f.provider.load()).connection.state,'connected');
});

test('P15.1 expired authentication cannot freeze on a hung refresh fetch or response body',{timeout:1000},async()=>{
 for(const refresh of [()=>new Promise(()=>{}),()=>({ok:true,json:()=>new Promise(()=>{})})]){
  const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify({...valid(),expiresAt:1}));
  const f=fixture({storage,refresh,requestTimeoutMs:10});
  const result=await f.provider.load();assert.equal(result.connection.state,'disconnected');assert.equal(result.projects.length,0);
  assert.equal(f.calls.some(c=>c.url.pathname.startsWith('/rest/')),false);
 }
});

test('P15.1 timed-out refresh cannot install a late session and deadline configuration fails closed',async()=>{
 const storage=new MemoryStorage();storage.setItem(KEY,JSON.stringify({...valid(),expiresAt:1}));let finish;
 const f=fixture({storage,requestTimeoutMs:10,refresh:()=>new Promise(r=>finish=r)});
 assert.equal((await f.provider.load()).connection.state,'disconnected');
 finish(json({access_token:'late-access',refresh_token:'late-refresh',expires_at:valid().expiresAt,user:{id:'synthetic-owner'}}));
 await new Promise(r=>setTimeout(r,10));assert.equal(JSON.parse(storage.getItem(KEY)).expiresAt,1);
 for(const requestTimeoutMs of [0,-1,NaN,Infinity,'10'])assert.throws(()=>new SupabaseOwnerRuntimeSnapshotProvider({supabaseUrl:'https://isolated-session.example.invalid',publishableKey:'sb_publishable_synthetic',requestTimeoutMs}),/timeout must be a positive safe integer/);
});

test('P15.1 simultaneous authentication retries share one prompt and session establishment',async()=>{
 let release;const gate=new Promise(r=>release=r);let prompts=0;
 const f=fixture({prompt:async submit=>{prompts++;await gate;await submit('owner@example.invalid','synthetic');}});
 const a=f.provider.load(),b=f.provider.load();await Promise.resolve();release();await Promise.all([a,b]);
 assert.equal(prompts,1);assert.equal(f.calls.filter(c=>c.url.searchParams.get('grant_type')==='password').length,1);assert.equal(f.storage.writes,1);assert.equal(f.storage.values.size,1);
});

test('P15.1 failed shared authentication clears its retry flight rather than retaining a rejected state',async()=>{
 let prompts=0;const f=fixture({prompt:async submit=>{prompts++;if(prompts===1)throw Error('cancelled');await submit('owner@example.invalid','synthetic');}});
 const first=await Promise.all([f.provider.load(),f.provider.load()]);assert.equal(prompts,1);assert.ok(first.every(s=>s.connection.state==='disconnected'));
 assert.equal((await f.provider.load()).connection.state,'connected');assert.equal(prompts,2);assert.equal(f.storage.values.size,1);
});
