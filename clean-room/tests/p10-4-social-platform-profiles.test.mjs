import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PlatformAdapterRegistry, PlatformProfileRegistry, createRuleDrivenPlatformAdapter, transformForProfile } from "../dist/social/index.js";

function setup(){
  const adapters=new PlatformAdapterRegistry();
  adapters.register(createRuleDrivenPlatformAdapter("youtube-adapter","youtube",1,"src/adapters/youtube-v1",["provider-docs:youtube-v1"]));
  const profiles=new PlatformProfileRegistry(adapters);
  const profile=profiles.register({key:"youtube:shorts",ownerId:"owner-1",platform:"youtube",version:1,adapterId:"youtube-adapter",adapterVersion:1,maxCaptionChars:20,allowedMediaKinds:["video"],requiredDisclosureTags:["#ad"],providerConstraints:{maxMediaCount:1,schedulingSupported:true},sourceRefs:["youtube-rules:v1"],observedAt:"2026-10-26T16:00:00Z"});
  return {adapters,profiles,profile};
}

test("P10.4 transforms execute through exact versioned adapter/profile pair",()=>{
  const {adapters,profile}=setup();
  const out=transformForProfile({caption:"1234567890123456789012345",mediaKind:"video",disclosures:[]},profile,adapters);
  assert.equal(out.caption.length,20);assert.deepEqual(out.disclosures,["#ad"]);assert.equal(out.profileVersion,1);assert.equal(out.adapterVersion,1);
});

test("P10.4 historical adapter/profile versions remain reproducible",()=>{
  const {adapters,profiles,profile}=setup();
  adapters.register(createRuleDrivenPlatformAdapter("youtube-adapter","youtube",2,"src/adapters/youtube-v2",["provider-docs:youtube-v2"]));
  profiles.register({...profile,version:2,adapterVersion:2,maxCaptionChars:30,sourceRefs:["youtube-rules:v2"],observedAt:"2026-10-26T17:00:00Z"});
  assert.equal(profiles.get("owner-1","youtube:shorts").version,2);assert.equal(profiles.getExact("owner-1","youtube:shorts",1).version,1);
  assert.equal(transformForProfile({caption:"1234567890123456789012345",mediaKind:"video",disclosures:[]},profiles.getExact("owner-1","youtube:shorts",1),adapters).caption.length,20);
});

test("P10.4 profile cannot silently change platform/adapter lineage or use unavailable adapter",()=>{
  const {adapters,profiles,profile}=setup();
  assert.throws(()=>profiles.register({...profile,version:2,platform:"instagram"}),/exact platform adapter|lineage/i);
  assert.throws(()=>profiles.register({...profile,version:2,adapterId:"other"}),/exact platform adapter|lineage/i);
  assert.throws(()=>profiles.register({...profile,version:2,adapterVersion:99}),/exact platform adapter/i);
  assert.throws(()=>profiles.register({...profile,version:1}),/version must advance/i);
  assert.equal(adapters.requireExact("youtube-adapter","youtube",1).version,1);
});

test("P10.4 malformed adapter output fails closed against profile rules",()=>{
  const adapters=new PlatformAdapterRegistry();
  adapters.register({id:"bad",platform:"youtube",version:1,implementationRef:"bad:test",sourceRefs:["test"],transform:(input)=>({caption:input.caption,mediaKind:input.mediaKind,disclosures:[]})});
  const profiles=new PlatformProfileRegistry(adapters);
  const profile=profiles.register({key:"yt",ownerId:"owner-1",platform:"youtube",version:1,adapterId:"bad",adapterVersion:1,maxCaptionChars:5,allowedMediaKinds:["video"],requiredDisclosureTags:["#ad"],providerConstraints:{},sourceRefs:["rule"],observedAt:"2026-10-26T16:00:00Z"});
  assert.throws(()=>transformForProfile({caption:"too-long",mediaKind:"video",disclosures:[]},profile,adapters),/caption limit/i);
  assert.throws(()=>transformForProfile({caption:"ok",mediaKind:"image",disclosures:[]},profile,adapters),/media kind/i);
});

test("P10.4 durable profile/adapter evidence is immutable owner scoped and version linked",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026111000_p10_4_social_platform_profiles.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_social_platform_adapter_history/i);assert.match(sql,/command_center_social_platform_profile_history/i);assert.match(sql,/adapter_version integer not null/i);assert.match(sql,/provider_constraints jsonb not null/i);assert.match(sql,/foreign key\(owner_id,adapter_id,adapter_version\)/i);assert.match(sql,/history is immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
