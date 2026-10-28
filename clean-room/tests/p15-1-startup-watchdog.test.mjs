import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {BrowserStartupCoordinator} from '../dist/runtime/browser-startup.js';
import {createRecoveryShellPlan} from '../dist/kernel/recovery.js';
function clock(){let next=0;const active=new Map(),all=new Map();return{active,all,setTimeout(fn,ms){const id=++next;active.set(id,{fn,ms});all.set(id,fn);return id;},clearTimeout(id){active.delete(id);},fire(id){active.delete(id);all.get(id)();}};}

test('P15.1 startup watchdog fails hung initialization once without private readiness and ignores stale deadlines',()=>{
 const time=clock(),states=[],startup=new BrowserStartupCoordinator(time);
 const first=startup.begin({timeoutMs:15,onTimeout:s=>states.push(s)});
 assert.equal(time.active.size,1);const old=[...time.active.keys()][0];
 const second=startup.begin({timeoutMs:25,onTimeout:s=>states.push(s)});assert.equal(time.active.size,1);
 time.fire(old);assert.equal(states.length,0);assert.equal(startup.current.state,'loading');
 const current=[...time.active.keys()][0];time.fire(current);assert.equal(states.length,1);assert.equal(states[0].state,'failed');assert.equal(states[0].privateDataAllowed,false);
 time.fire(current);assert.equal(states.length,1);assert.equal(startup.commitReady(second.generation).state,'failed');
 const next=startup.begin({timeoutMs:15,onTimeout:s=>states.push(s)});const done=[...time.active.keys()][0];startup.commitReady(next.generation);assert.equal(time.active.size,0);time.fire(done);assert.equal(states.length,1);
 assert.equal(startup.commitReady(first.generation).state,'ready');
 for(const timeoutMs of [0,-1,NaN,Infinity,'15'])assert.throws(()=>startup.begin({timeoutMs,onTimeout(){}}),/timeout/);
});

function recoveryContext(extra={}){
 const time=clock(),context={navigator:{},window:{setTimeout:time.setTimeout.bind(time)},clearTimeout:time.clearTimeout.bind(time),createRecoveryShellPlan,...extra};
 const code=readFileSync(new URL('../dist/runtime/browser-recovery.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
 vm.createContext(context);vm.runInContext(code,context);return{context,time};
}

test('P15.1 Recovery protocol deadline includes hung worker readiness and ignores late readiness',async()=>{
 let ready;const readiness=new Promise(r=>ready=r);let sent=0;
 const {context,time}=recoveryContext({navigator:{serviceWorker:{ready:readiness,controller:{postMessage(){sent++;}}}}});
 const result=context.hasKnownGoodRelease();assert.equal(time.active.size,1);time.fire([...time.active.keys()][0]);assert.equal(await result,false);
 ready({active:{postMessage(){sent++;}}});await Promise.resolve();await Promise.resolve();assert.equal(sent,0);
});

test('P15.1 Recovery renders and retries with no Brain Agent Analytics integrations or owner-data mutation',async()=>{
 let reloads=0;const make=()=>({dataset:{},children:[],attributes:{},setAttribute(k,v){this.attributes[k]=v;},replaceChildren(){this.children=[];},append(...n){this.children.push(...n);},addEventListener(k,v){this[k]=v;}});
 const document={createElement:make};const {context}=recoveryContext({document,window:{location:{reload(){reloads++;}}}});
 const root=make();context.installBrowserRecoveryShell(root,'invalid_configuration');await Promise.resolve();
 assert.equal(root.dataset.state,'recovery');assert.equal(root.attributes['aria-busy'],'false');
 const strings=JSON.stringify(root);assert.match(strings,/Recovery mode/);assert.match(strings,/invalid_configuration/);assert.doesNotMatch(strings,/owner-secret|private-project/);
 root.children.at(-1).children[0].click();assert.equal(reloads,1);
 const imports=readFileSync(new URL('../src/runtime/browser-recovery.ts',import.meta.url),'utf8').match(/^import .*$/gm);
 assert.equal(imports.length,1);assert.match(imports[0],/kernel\/recovery/);
});

test('P15.1 Recovery diagnostic codes reject raw or unknown runtime values without exposing private details',()=>{
 for(const reason of ['owner-secret-private-project','__proto__',null,{toString(){throw Error('must not stringify');}}]){
  const plan=createRecoveryShellPlan(reason,false);
  assert.equal(plan.reason,'startup_failed');assert.equal(plan.diagnostic.code,'startup_failed');assert.equal(plan.privateDataAllowed,false);assert.doesNotMatch(JSON.stringify(plan),/owner-secret|private-project|__proto__/);
 }
});

test('P15.1 known-good Recovery controls restore only through the shell protocol and retain owner data',async()=>{
 const make=()=>({dataset:{},children:[],isConnected:true,setAttribute(){},replaceChildren(){this.children=[];},append(...n){this.children.push(...n);},addEventListener(k,v){this[k]=v;}});
 const ownerData=Object.freeze({privateProject:'unchanged',draft:'unchanged'}),posted=[];let reloads=0;
 const channel=class{constructor(){this.port1={close(){},onmessage:null};this.port2={peer:this.port1};}};
 const controller={postMessage(data,ports){posted.push(data.type);ports[0].peer.onmessage({data:{ok:true}});}};
 const navigator={serviceWorker:{ready:Promise.resolve({}),controller}};
 const {context}=recoveryContext({document:{createElement:make},ownerData,MessageChannel:channel,navigator});
 context.window.location={reload(){reloads++;}};
 const root=make();context.installBrowserRecoveryShell(root,'startup_failed');await new Promise(r=>setTimeout(r,0));
 const controls=root.children.at(-1).children,restore=controls.find(n=>n.textContent==='Use last known-good release');assert.ok(restore);restore.click();await new Promise(r=>setTimeout(r,0));
 assert.equal(reloads,1);assert.deepEqual(posted,['QUERY_KNOWN_GOOD','RESTORE_KNOWN_GOOD']);assert.deepEqual(ownerData,{privateProject:'unchanged',draft:'unchanged'});
});

test('P15.1 shipped startup watchdog transitions to Recovery and fences late runtime startup',()=>{
 const time=clock(),handlers={},recovery=[];
 const node=()=>({dataset:{},children:[],setAttribute(){},replaceChildren(){this.children=[];},append(...nodes){this.children.push(...nodes);}});
 const bootstrap=node(),root={querySelector:()=>null};
 const document={querySelector:s=>s==='#app'?root:bootstrap,createElement:()=>node()};
 const window={addEventListener:(k,v)=>handlers[k]=v,dispatchEvent:e=>{handlers[e.type]?.(e);return true;}};
 class TimedCoordinator extends BrowserStartupCoordinator{constructor(){super(time);}}
 const code=readFileSync(new URL('../dist/runtime/browser-startup-runtime.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export /g,'');
 vm.runInNewContext(code,{window,document,Event,BrowserStartupCoordinator:TimedCoordinator,assertBrowserStartupConfiguration(){},classifyRecoveryFailure:()=> 'startup_failed',installBrowserRecoveryShell:(n,r)=>{recovery.push(r);n.dataset.state='recovery';},markCurrentReleaseKnownGood(){},MutationObserver:class{observe(){}disconnect(){}}});
 assert.equal(time.active.size,1);time.fire([...time.active.keys()][0]);
 assert.deepEqual(recovery,['startup_failed']);assert.equal(bootstrap.dataset.state,'recovery');assert.equal(window.__commandCenterStartupFailed,true);
});

test('P15.1 timed-out data initialization cannot overwrite Recovery on late completion or connectivity retry',async()=>{
 let complete;const pending=new Promise(r=>complete=r),handlers={},root={textContent:'',replaceChildren(node){this.textContent=node?.textContent??'';}};
 const window={location:{pathname:'/'},addEventListener:(k,v)=>handlers[k]=v};
 const document={querySelector:s=>s==='#app'?root:null,createElement:()=>({dataset:{},textContent:''})};
 const context={window,document,createCoreRouteRegistry:()=>({}),ApplicationShell:class{},providerFromDocument:()=>({load:()=>pending}),BrowserPwaUpdateClient:class{view={state:'idle'};subscribe(fn){fn(this.view);}async registerAndCheck(){}}};
 const code=readFileSync(new URL('../dist/runtime/browser.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
 vm.createContext(context);vm.runInContext(code,context);assert.match(root.textContent,/Starting/);
 window.__commandCenterStartupFailed=true;handlers['command-center-startup-failed']();root.textContent='Recovery mode';
 complete({connection:{state:'connected'},projects:[{name:'PRIVATE LATE DATA'}]});await new Promise(r=>setTimeout(r,0));
 assert.equal(root.textContent,'Recovery mode');await context.renderApplication();assert.equal(root.textContent,'Recovery mode');
});
