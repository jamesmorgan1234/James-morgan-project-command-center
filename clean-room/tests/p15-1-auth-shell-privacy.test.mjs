import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {setImmediate as tick} from 'node:timers/promises';
import {promptForOwnerCredentials,installOwnerSignOutControl} from '../dist/runtime/owner-auth-ui.js';

class Node {
  children=[]; dataset={}; style={setProperty(){}}; listeners={}; attributes={}; disabled=false;
  constructor(tag='div'){this.tagName=tag;this.ownText='';}
  set textContent(v){this.ownText=v;this.children=[];}
  get textContent(){return this.ownText+this.children.map(n=>n.textContent??String(n)).join('');}
  append(...nodes){this.children.push(...nodes);} prepend(...nodes){this.children.unshift(...nodes);}
  replaceChildren(...nodes){this.ownText='';this.children=[...nodes];}
  setAttribute(k,v){this.attributes[k]=v;} addEventListener(k,fn){this.listeners[k]=fn;}
  reportValidity(){return true;} focus(){} querySelector(){return null;}
  all(){return [this,...this.children.flatMap(n=>n.all?.()??[])];}
}
function dom(path='/project/private-project'){
 const root=new Node(),grid=new Node(),events=new EventTarget();
 const document={title:'Private title',createElement:t=>new Node(t),createElementNS:(_ns,t)=>new Node(t),querySelector:s=>s==='#app'?root:s==='.navigation-grid'?grid:null};
 const window={location:{pathname:path,search:'',href:'https://example.invalid'+path,assign(){}},history:{length:1},addEventListener:events.addEventListener.bind(events),dispatchEvent:events.dispatchEvent.bind(events)};
 return {root,grid,document,window};
}
async function globals(d,fn){const old={document:globalThis.document,window:globalThis.window,fetch:globalThis.fetch};globalThis.document=d.document;globalThis.window=d.window;if(d.fetch)globalThis.fetch=d.fetch;try{return await fn();}finally{for(const[k,v]of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}

test('P15.1 authentication errors never expose raw passkey or internal account state',async()=>{
 for(const raw of ['passkey lookup: private-project exists for owner@example.invalid','webauthn database disabled account secret','This account signed in successfully but is not authorized for Command Center']){
  const d=dom();await globals(d,async()=>{
   void promptForOwnerCredentials(async()=>{throw new Error(raw);});
   const form=d.root.all().find(n=>n.tagName==='form');
   for(const n of d.root.all().filter(n=>n.tagName==='input'))n.value='synthetic';
   form.listeners.submit({preventDefault(){}});await tick();
   const message=d.root.all().find(n=>n.attributes.role==='alert').textContent;
   assert.equal(message.includes(raw),false);assert.doesNotMatch(message,/private-project|owner@example|database|signed in successfully|not authorized/i);
   assert.match(message,/sign-in|sign in|try again/i);
   assert.equal(d.root.all().find(n=>n.type==='password').value,'');
   assert.equal(d.root.all().find(n=>n.type==='submit').disabled,false);
  });
 }
});

test('P15.1 sign-out hides private DOM before awaiting remote logout including failure',async()=>{
 const d=dom();await globals(d,async()=>{
  d.root.textContent='PRIVATE OWNER DATA';let reject;const remote=new Promise((_r,j)=>reject=j);let called=false;
  installOwnerSignOutControl(()=>{called=true;assert.doesNotMatch(d.root.textContent,/PRIVATE OWNER DATA/);return remote;});
  await new Promise(r=>setTimeout(r,5));
  d.grid.children[0].listeners.click();assert.doesNotMatch(d.root.textContent,/PRIVATE OWNER DATA/);assert.equal(d.document.title,'Command Center');await tick();assert.equal(called,true);
  reject(new Error('network unavailable'));await tick();
 });
});

test('P15.1 public shell is route independent and strips all disconnected private projections',async()=>{
 const d=dom(),fingerprints=['private-project','private-book-title','private-revenue','private-financial-data','private-project-status','private-agent-activity','private-brain-knowledge','private-owner-decision','private-metric','private-provider-name','private-document-name'];
 const {createDisconnectedRuntimeSnapshot}=await import('../dist/runtime/snapshot.js');
 const snapshot={...createDisconnectedRuntimeSnapshot(),projects:[{name:fingerprints[0]}],surfaces:fingerprints.slice(1).map(v=>({summary:{state:'known',value:v}})),brain:{knowledge:fingerprints[6]}};
 const query=d.document.querySelector;d.document.querySelector=s=>s==='meta[name="command-center-runtime-endpoint"]'?{content:'/api/runtime'}:query(s);
 d.fetch=async()=>new Response(JSON.stringify(snapshot));
 await globals(d,async()=>{
  const renderer=await import('../dist/runtime/browser.js?privacy-shell');await tick();
  const initial=d.root.textContent;
  assert.match(initial,/Private owner system/);for(const value of fingerprints)assert.equal(initial.includes(value),false);
  for(const path of ['/books','/finance','/brain','/private-document','/project/other-project']){
   d.window.location.pathname=path;await renderer.renderApplication();assert.equal(d.root.textContent,initial);
  }
 });
});

test('P15.1 sign-out prevents in-flight and subsequent loads from restoring private UI',async()=>{
 const d=dom();await globals(d,async()=>{
  let release;const pending=new Promise(r=>release=r);
  const {DisconnectedRuntimeSnapshotProvider}=await import('../dist/runtime/provider.js');
  const original=DisconnectedRuntimeSnapshotProvider.prototype.load;
  DisconnectedRuntimeSnapshotProvider.prototype.load=()=>pending;
  try {
   const renderer=await import('../dist/runtime/browser.js?privacy-signout');
   d.root.textContent='PRIVATE OWNER DATA';d.window.dispatchEvent(new Event('command-center-owner-signout'));
   assert.equal(d.root.textContent,'');
   release({connection:{state:'connected'},projects:[{name:'PRIVATE LATE RESULT'}]});await tick();
   assert.equal(d.root.textContent,'');await renderer.renderApplication();assert.equal(d.root.textContent,'');
  } finally {DisconnectedRuntimeSnapshotProvider.prototype.load=original;}
 });
});

test('P15.1 new loads clear prior projections and discard older completions and thrown provider errors',async()=>{
 const d=dom();let resolveOld;const waiting=new Promise(r=>resolveOld=r);
 const {DisconnectedRuntimeSnapshotProvider}=await import('../dist/runtime/provider.js');
 const {createDisconnectedRuntimeSnapshot}=await import('../dist/runtime/snapshot.js');
 const original=DisconnectedRuntimeSnapshotProvider.prototype.load;let calls=0;
 DisconnectedRuntimeSnapshotProvider.prototype.load=async()=>{calls++;if(calls===1)return waiting;if(calls===3)throw Error('PRIVATE PROVIDER ERROR');return createDisconnectedRuntimeSnapshot();};
 try{await globals(d,async()=>{
  d.root.textContent='PRIVATE PREVIOUS OWNER';
  const renderer=await import('../dist/runtime/browser.js?privacy-generation');
  assert.doesNotMatch(d.root.textContent,/PRIVATE/);assert.match(d.root.textContent,/Starting/);
  await renderer.renderApplication();const current=d.root.textContent;
  resolveOld({connection:{state:'connected'},projects:[{name:'PRIVATE OLD RESULT'}]});await tick();assert.equal(d.root.textContent,current);
  await renderer.renderApplication();assert.equal(d.root.textContent,current);assert.doesNotMatch(d.root.textContent,/PRIVATE/);
 });}finally{DisconnectedRuntimeSnapshotProvider.prototype.load=original;}
});

test('P15.1 protected API and auth fetches bypass even prepopulated shell caches',async()=>{
 const handlers={};let cacheTouches=0,online=true;const calls=[];
 const context={URL,Response,Request,Set,Map,Date,Number,Error,Promise,self:{location:{origin:'https://example.invalid'},addEventListener:(k,fn)=>handlers[k]=fn},caches:{open(){cacheTouches++;throw Error('cache access forbidden');},match(){cacheTouches++;return new Response('PRIVATE CACHED');}},fetch:async(req,init)=>{calls.push(init);if(!online)throw Error('offline');return new Response('network response');}};
 vm.runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),context);
 for(const path of ['/api/private','/__cc_auth__/token','/auth/private']){
  let response;handlers.fetch({request:new Request('https://example.invalid'+path),respondWith:p=>response=p});
  assert.equal(await(await response).text(),'network response');assert.equal(calls.at(-1).cache,'no-store');
  online=false;handlers.fetch({request:new Request('https://example.invalid'+path),respondWith:p=>response=p});await assert.rejects(response,/offline/);online=true;
 }
 assert.equal(cacheTouches,0);
});
