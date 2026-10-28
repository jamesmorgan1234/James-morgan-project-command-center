import test from "node:test";
import assert from "node:assert/strict";
import { SpecialistLifecycleRegistry } from "../dist/specialists/index.js";

function registry(){const r=new SpecialistLifecycleRegistry();r.registerType({typeKey:"shopping",truthOwner:"specialist:shopping",isolationClass:"specialist:shopping",requiredProviderCapabilities:["offers_read"],sourceRefs:["type:shopping"]});r.registerType({typeKey:"media",truthOwner:"specialist:media",isolationClass:"specialist:media",requiredProviderCapabilities:["media_read"],sourceRefs:["type:media"]});return r;}
const shopping={id:"p1",ownerId:"owner-1",projectId:"coupon",typeKey:"shopping",displayName:"Coupon",canonicalRef:"specialist:coupon",status:"active",providerCapabilities:["offers_read"],sourceRefs:["project:coupon"]};

test("P12.8 new specialist types/projects register without kernel surgery",()=>{const r=registry();r.registerType({typeKey:"future_type",truthOwner:"specialist:future_type",isolationClass:"specialist:future_type",requiredProviderCapabilities:[],sourceRefs:["future:type"]});const p=r.registerProject({...shopping,id:"future",projectId:"future-project",typeKey:"future_type",displayName:"Future",canonicalRef:"specialist:future"});assert.equal(p.typeKey,"future_type");});

test("P12.8 cross-specialist canonical truth cannot leak",()=>{const r=registry();r.registerProject(shopping);assert.throws(()=>r.registerProject({...shopping,id:"media",projectId:"media-project",typeKey:"media",displayName:"Media",canonicalRef:"specialist:coupon",providerCapabilities:["media_read"]}),/canonical truth is isolated/i);});

test("P12.8 provider loss fails locally and does not alter unrelated specialists",()=>{const r=registry();r.registerProject(shopping);r.registerProject({...shopping,id:"media",projectId:"media-project",typeKey:"media",displayName:"Media",canonicalRef:"specialist:media-project",providerCapabilities:["media_read"]});const assessment=r.assessProvider("owner-1","coupon","offers_read","unavailable",["provider:down"]);assert.equal(assessment.isolatedFailure,true);assert.equal(r.get("owner-1","media-project").status,"active");});

test("P12.8 rename and merge require exact owner/project/action authorization",()=>{const r=registry();r.registerProject(shopping);r.registerProject({...shopping,id:"p2",projectId:"coupon-v2",displayName:"Coupon v2",canonicalRef:"specialist:coupon-v2"});assert.throws(()=>r.rename("owner-1","coupon","New Name",{authorizationRef:"a",ownerId:"owner-1",projectId:"coupon",action:"merge"}),/exact owner\/project\/action authorization/i);assert.equal(r.rename("owner-1","coupon","Coupon AutoPilot",{authorizationRef:"evd_rename-1",ownerId:"owner-1",projectId:"coupon",action:"rename"}).displayName,"Coupon AutoPilot");const [source,target]=r.merge("owner-1","coupon","coupon-v2",{authorizationRef:"evd_merge-1",ownerId:"owner-1",projectId:"coupon",action:"merge",targetProjectId:"coupon-v2"});assert.equal(source.status,"replaced");assert.equal(source.replacedByProjectId,"coupon-v2");assert.equal(target.status,"active");});

test("P12.8 dormant activation fails closed until required providers are available",()=>{const r=registry();r.registerProject(shopping);r.setDormant("owner-1","coupon");const auth={authorizationRef:"evd_activate-1",ownerId:"owner-1",projectId:"coupon",action:"activate"};assert.throws(()=>r.activate("owner-1","coupon",[],auth),/blocked by unavailable required provider capability/i);assert.equal(r.activate("owner-1","coupon",["offers_read"],auth).status,"active");});

test("P12.8 replacement preserves specialist type and explicit authorization",()=>{const r=registry();r.registerProject(shopping);const replacement={...shopping,id:"replacement",projectId:"coupon-next",displayName:"Coupon Next",canonicalRef:"specialist:coupon-next"};assert.throws(()=>r.replaceProject("owner-1","coupon",{...replacement,typeKey:"media",providerCapabilities:["media_read"]},{authorizationRef:"evd_replace-1",ownerId:"owner-1",projectId:"coupon",action:"replace",targetProjectId:"coupon-next"}),/preserve owner and specialist type/i);const [old,next]=r.replaceProject("owner-1","coupon",replacement,{authorizationRef:"evd_replace-1",ownerId:"owner-1",projectId:"coupon",action:"replace",targetProjectId:"coupon-next"});assert.equal(old.status,"replaced");assert.equal(next.projectId,"coupon-next");});


test("P12.8 all protected lifecycle transitions reject noncanonical evidence without mutating state",()=>{
  for(const action of ["rename","merge","activate","replace","archive"]){
    for(const authorizationRef of ["rename:1","merge:1","auth:activate","","   ","evd_","evd_UPPER","evd_double--hyphen","prj_wrong-kind"," evd_padded","evd_trailing\n"]){
      const r=registry();r.registerProject(shopping);
      r.registerProject({...shopping,id:"p2",projectId:"coupon-v2",canonicalRef:"specialist:coupon-v2"});
      if(action==="activate")r.setDormant("owner-1","coupon");
      const before=r.list();
      const auth={authorizationRef,ownerId:"owner-1",projectId:"coupon",action,targetProjectId:"coupon-v2"};
      const operations={rename:()=>r.rename("owner-1","coupon","Changed",auth),merge:()=>r.merge("owner-1","coupon","coupon-v2",auth),activate:()=>r.activate("owner-1","coupon",["offers_read"],auth),replace:()=>r.replaceProject("owner-1","coupon",{...shopping,id:"next",projectId:"next",canonicalRef:"specialist:next"},{...auth,targetProjectId:"next"}),archive:()=>r.archive("owner-1","coupon",auth)};
      assert.throws(operations[action],/canonical evidence reference/i,`${action}: ${JSON.stringify(authorizationRef)}`);
      assert.deepEqual(r.list(),before);
    }
  }
});

test("P12.8 canonical evidence permits archive but cannot bypass exact scope action or target",()=>{
  const r=registry();r.registerProject(shopping);r.registerProject({...shopping,id:"p2",projectId:"coupon-v2",canonicalRef:"specialist:coupon-v2"});
  const auth={authorizationRef:"evd_lifecycle-archive-1",ownerId:"owner-1",projectId:"coupon",action:"archive"};
  for(const patch of [{ownerId:"owner-2"},{projectId:"other"},{action:"rename"}])assert.throws(()=>r.archive("owner-1","coupon",{...auth,...patch}),/exact owner\/project\/action authorization/i);
  assert.throws(()=>r.merge("owner-1","coupon","coupon-v2",{...auth,action:"merge",targetProjectId:"other"}),/exact owner\/project\/action authorization/i);
  assert.equal(r.get("owner-1","coupon").status,"active");
  assert.equal(r.archive("owner-1","coupon",auth).status,"archived");
});
