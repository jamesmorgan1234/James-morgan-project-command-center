import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  createIdentifier,
  parseIdentifier
} from "../dist/kernel/identifiers.js";
import {
  KnowledgeLedger,
  known,
  SHARED_INTELLIGENCE_CONTRACT_VERSION,
  SHARED_INTELLIGENCE_ONTOLOGY_ID,
  SHARED_INTELLIGENCE_ONTOLOGY_VERSION,
  intelligenceScopeKey,
  validateSharedIntelligenceEnvelope
} from "../dist/data/index.js";

const T0 = "2026-10-25T21:00:00Z";
const T1 = "2026-10-25T21:01:00Z";

function envelope(overrides = {}) {
  return {
    contractVersion: SHARED_INTELLIGENCE_CONTRACT_VERSION,
    ontology: { id: SHARED_INTELLIGENCE_ONTOLOGY_ID, version: SHARED_INTELLIGENCE_ONTOLOGY_VERSION },
    claim: {
      id: "knowledge-shared-one",
      subjectId: "cap_shared-learning",
      version: 1,
      kind: "verified",
      state: "current",
      value: known({ outcome: "improved" }),
      confidence: 0.9,
      sourceRefs: ["benchmark:one"],
      observedAt: T0,
      recordedAt: T1
    },
    epistemicLabel: "verified",
    temporalLabel: "current",
    causalLabel: "not_claimed",
    applicability: { scope: "project", ref: "prj_command-center" },
    privacy: { ownerId: "owner-1", classification: "project_private", scopeRef: "prj_command-center" },
    evidenceIds: ["evd_pif1-proof"],
    ...overrides
  };
}

const context = {
  ownerId: "owner-1",
  authorizedScopeKeys: ["project:prj_command-center"],
  ontologyId: SHARED_INTELLIGENCE_ONTOLOGY_ID,
  minimumOntologyVersion: 1,
  maximumOntologyVersion: 1,
  now: "2026-10-25T22:00:00Z"
};

test("PIF.1 extends the canonical C1 identifier owner with explicit ecosystem applicability kinds", () => {
  assert.equal(parseIdentifier(createIdentifier("company", "morgan-commerce")).kind, "company");
  assert.equal(parseIdentifier(createIdentifier("brain", "aro")).kind, "brain");
  assert.equal(parseIdentifier(createIdentifier("domain", "media-intelligence")).kind, "domain");
  assert.equal(parseIdentifier(createIdentifier("condition", "low-cash-today")).kind, "condition");
});

test("PIF.1 validates one shared intelligence envelope without replacing the C3 knowledge claim", () => {
  const value = envelope();
  assert.equal(intelligenceScopeKey(value.applicability), "project:prj_command-center");
  assert.equal(validateSharedIntelligenceEnvelope(value, context), value);
});

test("PIF.1 rejects ambiguous identity, missing provenance, incompatible ontology, invalid causality, and unauthorized scope", () => {
  assert.throws(() => validateSharedIntelligenceEnvelope(envelope({ claim: { ...envelope().claim, subjectId: "not-canonical" } }), context), /canonical identifier/i);
  assert.throws(() => validateSharedIntelligenceEnvelope(envelope({ evidenceIds: [] }), context), /Canonical evidence is required/i);
  assert.throws(() => validateSharedIntelligenceEnvelope(envelope({ ontology: { id: "mod_other-ontology", version: 1 } }), context), /Incompatible shared intelligence ontology/i);
  assert.throws(() => validateSharedIntelligenceEnvelope(envelope({ causalLabel: "proven-because-i-said-so" }), context), /Invalid causal label/i);
  assert.throws(() => validateSharedIntelligenceEnvelope(envelope({ applicability: { scope: "company", ref: "cmp_morgancommerce" }, privacy: { ownerId: "owner-1", classification: "company_private", scopeRef: "cmp_morgancommerce" } }), context), /Unauthorized intelligence applicability scope/i);
});

test("PIF.1 refuses blind global promotion of scoped private intelligence", () => {
  const privateGlobal = envelope({ applicability: { scope: "global" }, privacy: { ownerId: "owner-1", classification: "project_private", scopeRef: "prj_command-center" } });
  assert.throws(() => validateSharedIntelligenceEnvelope(privateGlobal, { ...context, authorizedScopeKeys: ["global"] }), /Global intelligence must be explicitly ecosystem_shared/i);
});

test("legacy KnowledgeLedger remains compatible and is not forced into PIF.1 metadata", () => {
  const ledger = new KnowledgeLedger();
  ledger.append({ id: "legacy-one", subjectId: "legacy:subject", version: 1, kind: "verified", state: "current", value: known("kept"), confidence: 1, sourceRefs: ["legacy-source"], observedAt: T0, recordedAt: T1 });
  assert.equal(ledger.current("legacy:subject").id, "legacy-one");
});

test("PIF.1 storage extends command_center_knowledge_claims instead of creating a second claim store", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261025213000_pif1_shared_intelligence_contracts.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.command_center_knowledge_claims/i);
  assert.doesNotMatch(sql, /create table if not exists public\.command_center_.*intelligence.*claims/i);
  assert.match(sql, /intelligence_contract_version/i);
  assert.match(sql, /ontology_id/i);
  assert.match(sql, /epistemic_label = kind/i);
  assert.match(sql, /temporal_label in \('current','historical','stale','superseded'\)/i);
  assert.match(sql, /causal_label in \('not_claimed','observed_association','causal_hypothesis','causal_supported'\)/i);
  assert.match(sql, /c3_pif1_evidence_ids_valid/i);
  assert.match(sql, /c3_pif1_applicability_valid/i);
  assert.match(sql, /c3_pif1_privacy_valid/i);
  assert.match(sql, /Private intelligence cannot be generalized globally/i);
  assert.match(sql, /command_center_append_shared_intelligence_claim/i);
  assert.match(sql, /command_center_append_knowledge_claim/i);
});
