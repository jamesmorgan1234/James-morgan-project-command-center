import test from "node:test";
import assert from "node:assert/strict";
import { PortabilityCenter, rebuildProjection } from "../dist/data/index.js";

test("P3.12 representative high-volume projection rebuild preserves exact sequence coverage", () => {
  const events = Array.from({ length: 5000 }, (_, index) => ({
    sequence: index + 1,
    eventId: `evt-${String(index + 1).padStart(6, "0")}`,
    payloadHash: `hash-${String(index + 1).padStart(6, "0")}`
  }));
  const evidence = rebuildProjection(events);
  assert.equal(evidence.eventCount, 5000);
  assert.equal(evidence.firstSequence, 1);
  assert.equal(evidence.lastSequence, 5000);
  assert.match(evidence.hashChain, /^1:evt-000001:/);
  assert.match(evidence.hashChain, /5000:evt-005000:/);
});

test("P3.12 representative large import dry-run never silently overwrites older/equal divergent truth", () => {
  const center = new PortabilityCenter();
  const existing = Array.from({ length: 2000 }, (_, index) => ({
    id: `entity-${index}`,
    entityType: "project",
    version: 2,
    contentHash: `existing-${index}`,
    sensitivity: "internal",
    provenanceRefs: [`source-${index}`],
    data: { index }
  }));
  const incoming = existing.map((record, index) => index % 2 === 0
    ? { ...record }
    : { ...record, contentHash: `divergent-${index}` });
  const result = center.stageImport("scale-batch", incoming, existing);
  assert.equal(result.results.length, 2000);
  assert.equal(result.results.filter((item) => item.disposition === "duplicate").length, 1000);
  assert.equal(result.results.filter((item) => item.disposition === "conflict").length, 1000);
  assert.equal(result.canApplyWithoutOverwrite, false);
});

test("P3.12 projection recovery fails closed on a gap even near the end of a large stream", () => {
  const events = Array.from({ length: 2500 }, (_, index) => ({ sequence: index + 1, eventId: `e-${index + 1}`, payloadHash: `h-${index + 1}` }));
  events[2499] = { ...events[2499], sequence: 2501 };
  assert.throws(() => rebuildProjection(events), /Projection sequence gap/);
});
