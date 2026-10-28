import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MEDIA_SPECIALIST_PROFILE, validateMediaSourceEvidence, requireMediaRoute, assertMediaWorkerModeAllowed, assertMediaPublishReady } from "../dist/specialists/index.js";

const source={id:"src-1",ownerId:"owner-1",sourceRef:"provider:video-1",contentRef:"video-1",rightsRefs:["rights:license-1"],provenanceRefs:["provider:source-1"],observedAt:"2026-10-26T16:00:00Z"};

test("P12.3 media source requires rights and provenance",()=>{assert.doesNotThrow(()=>validateMediaSourceEvidence(source));assert.throws(()=>validateMediaSourceEvidence({...source,rightsRefs:[]}),/media source rights/i);assert.throws(()=>validateMediaSourceEvidence({...source,provenanceRefs:[]}),/media source provenance/i);});

test("P12.3 media specialist owns research production publishing analytics and revenue routes",()=>{for(const stage of ["research","production","publishing","analytics","revenue"]) assert.equal(requireMediaRoute(MEDIA_SPECIALIST_PROFILE,stage).stage,stage);assert.equal(MEDIA_SPECIALIST_PROFILE.truthOwner,"specialist:media");});

test("P12.3 autonomous worker boundary blocks portfolio-wide mode",()=>{assert.doesNotThrow(()=>assertMediaWorkerModeAllowed(MEDIA_SPECIALIST_PROFILE,"project_auto"));assert.throws(()=>assertMediaWorkerModeAllowed(MEDIA_SPECIALIST_PROFILE,"portfolio_auto"),/outside specialist autonomous boundary/i);});

test("P12.3 publishing route requires canonical protected-action authorization evidence",()=>{assert.equal(requireMediaRoute(MEDIA_SPECIALIST_PROFILE,"publishing").protectedAction,true);assert.throws(()=>assertMediaPublishReady(source),/canonical protected-action authorization evidence/i);assert.throws(()=>assertMediaPublishReady(source,"owner:publish"),/canonical protected-action authorization evidence/i);assert.doesNotThrow(()=>assertMediaPublishReady(source,"evd_owner-publish"));});

test("P12.3 durable media evidence preserves specialist ownership rights workflow worker boundaries and publish authorization",()=>{const sql=readFileSync(new URL("../../supabase/migrations/20261026132000_p12_3_media_specialist.sql",import.meta.url),"utf8");assert.match(sql,/command_center_media_source_history/i);assert.match(sql,/rights_refs text\[\]/i);assert.match(sql,/provenance_refs text\[\]/i);assert.match(sql,/truth_owner text not null default 'specialist:media'/i);assert.match(sql,/command_center_media_publish_authorization_history/i);assert.match(sql,/authorization_evidence_id text not null/i);assert.match(sql,/authorization_evidence_id ~ '\^evd_/i);assert.match(sql,/media evidence is immutable/i);});
