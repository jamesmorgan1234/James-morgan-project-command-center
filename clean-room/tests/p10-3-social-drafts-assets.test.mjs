import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SocialDraftRegistry, PublishLedger, assertDraftPublishReady, cloneDraftForAccount, reviseDraftContent } from "../dist/social/index.js";

function draft(overrides={}) {
  return {
    id:"draft-1", ownerId:"owner-1", brandId:"brand-1", intendedAccountId:"account-1", version:1,
    observedAt:"2026-10-26T16:00:00Z", body:"Approved content", contentHash:"sha256:content-v1",
    sourceAssetRefs:["asset-1"],
    assetBindings:[{assetRef:"asset-1",contentHash:"sha256:asset-1",provenanceRefs:["asset-source:1"],rightsEvidenceRefs:["rights:asset-1"]}],
    rightsEvidenceRefs:["rights:asset-1"], provenanceRefs:["draft-source:1"], approvalRefs:["approval-1"],
    approvalBindings:[{approvalRef:"approval-1",approverRef:"owner-approval:1",draftVersion:1,intendedAccountId:"account-1",contentHash:"sha256:content-v1",approvedAt:"2026-10-26T16:01:00Z",evidenceRefs:["approval-evidence:1"]}],
    sensitivityRank:1, ...overrides
  };
}

const connection={accountId:"account-1",state:"connected",credentialRef:"secret-ref:social:1",grantedScopes:["publish"],providerHealth:"available",verifiedAt:"2026-10-26T16:00:00Z",tokenPresent:true};

test("P10.3 publish readiness binds approval to exact revision content and account",()=>{
  assert.doesNotThrow(()=>assertDraftPublishReady(draft()));
  assert.throws(()=>assertDraftPublishReady(draft({intendedAccountId:"account-2"})),/exact draft revision\/content\/account/i);
  assert.throws(()=>assertDraftPublishReady(draft({contentHash:"sha256:changed"})),/exact draft revision\/content\/account/i);
  assert.throws(()=>assertDraftPublishReady(draft({version:2})),/exact draft revision\/content\/account/i);
});

test("P10.3 every source asset requires exact provenance and rights binding",()=>{
  assert.throws(()=>assertDraftPublishReady(draft({assetBindings:[]})),/every source asset/i);
  assert.throws(()=>assertDraftPublishReady(draft({assetBindings:[{assetRef:"asset-1",contentHash:"sha256:asset-1",provenanceRefs:[],rightsEvidenceRefs:["rights:asset-1"]}]})),/asset provenance/i);
  assert.throws(()=>assertDraftPublishReady(draft({assetBindings:[{assetRef:"asset-1",contentHash:"sha256:asset-1",provenanceRefs:["source"],rightsEvidenceRefs:[]}]})),/asset rights evidence/i);
  assert.throws(()=>assertDraftPublishReady(draft({rightsEvidenceRefs:["rights:unbound"]})),/bound to the exact source assets/i);
});

test("P10.3 account/content revision invalidates prior approval while preserving asset evidence",()=>{
  const accountClone=cloneDraftForAccount(draft(),"account-2");
  assert.equal(accountClone.version,2);assert.equal(accountClone.intendedAccountId,"account-2");assert.deepEqual(accountClone.approvalRefs,[]);assert.deepEqual(accountClone.approvalBindings,[]);assert.equal(accountClone.assetBindings[0].rightsEvidenceRefs[0],"rights:asset-1");
  assert.throws(()=>assertDraftPublishReady(accountClone),/publication approval evidence/i);
  const revised=reviseDraftContent(draft(),{body:"Changed",contentHash:"sha256:content-v2",observedAt:"2026-10-26T16:02:00Z",sourceAssetRefs:["asset-1"],assetBindings:draft().assetBindings,rightsEvidenceRefs:["rights:asset-1"],provenanceRefs:["draft-source:2"],sensitivityRank:1});
  assert.equal(revised.version,2);assert.equal(revised.contentHash,"sha256:content-v2");assert.deepEqual(revised.approvalRefs,[]);assert.throws(()=>assertDraftPublishReady(revised),/publication approval evidence/i);
});

test("P10.3 draft registry prevents owner brand and version substitution",()=>{
  const registry=new SocialDraftRegistry();registry.register(draft());
  assert.throws(()=>registry.register(draft({ownerId:"owner-2",version:2})),/lineage cannot be substituted/i);
  assert.throws(()=>registry.register(draft({brandId:"brand-2",version:2})),/lineage cannot be substituted/i);
  assert.throws(()=>registry.register(draft()),/version must advance/i);
  assert.equal(registry.requireExact("draft-1","owner-1","brand-1","account-1",1,"sha256:content-v1").id,"draft-1");
  assert.throws(()=>registry.requireExact("draft-1","owner-1","brand-1","wrong",1,"sha256:content-v1"),/exact approved social draft revision mismatch/i);
});

test("P10.3 approvals cannot predate revision and malformed evidence fails closed",()=>{
  assert.throws(()=>assertDraftPublishReady(draft({approvalBindings:[{...draft().approvalBindings[0],approvedAt:"2026-10-26T15:59:59Z"}]})),/cannot predate/i);
  assert.throws(()=>assertDraftPublishReady(draft({provenanceRefs:[]})),/draft provenance/i);
  assert.throws(()=>assertDraftPublishReady(draft({approvalBindings:[{...draft().approvalBindings[0],evidenceRefs:[]}]})),/approval evidence/i);
});

test("P10.3 publishing seam refuses stale approval after content/account drift",()=>{
  const ledger=new PublishLedger();
  const intent={id:"pub-1",ownerId:"owner-1",brandId:"brand-1",accountId:"account-1",draftId:"draft-1",idempotencyKey:"idem-1",state:"prepared",authorizationRef:"owner-auth:1",requiredScopes:["publish"]};
  assert.doesNotThrow(()=>ledger.prepare(intent,draft(),connection));
  assert.throws(()=>new PublishLedger().prepare({...intent,id:"pub-2",idempotencyKey:"idem-2"},draft({contentHash:"sha256:changed"}),connection),/exact draft revision\/content\/account/i);
});

test("P10.3 durable schema preserves immutable owner-scoped draft asset rights provenance and approval bindings",()=>{
  const sql=readFileSync(new URL("../../supabase/migrations/20261026110000_p10_3_social_drafts_assets.sql",import.meta.url),"utf8");
  assert.match(sql,/command_center_social_draft_revision_history/i);
  assert.match(sql,/command_center_social_draft_asset_bindings/i);
  assert.match(sql,/command_center_social_draft_approval_bindings/i);
  assert.match(sql,/intended_account_id text not null/i);assert.match(sql,/content_hash text not null/i);
  assert.match(sql,/provenance_refs text\[\] not null check\(cardinality\(provenance_refs\)>0\)/i);
  assert.match(sql,/rights_evidence_refs text\[\] not null check\(cardinality\(rights_evidence_refs\)>0\)/i);
  assert.match(sql,/approved_content_hash text not null/i);assert.match(sql,/approved_draft_version integer not null/i);
  assert.match(sql,/history is immutable|bindings are immutable/i);assert.match(sql,/is_command_center_authorized/i);
});
