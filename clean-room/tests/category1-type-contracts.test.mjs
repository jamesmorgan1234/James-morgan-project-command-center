import test from "node:test";
import assert from "node:assert/strict";
import {
  assertStrictSettings,
  assertNoAnyEscape,
  validateSchema,
  generateSchemaType,
  assertTypeSync,
  assertNoContractDrift,
  assertFoundationRulesVersioned,
  requireArchitectureReview
} from "../dist/kernel/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const schema = {
  name: "ProjectRow",
  fields: [
    { name: "id", type: "string", required: true },
    { name: "runwayMonths", type: "number", required: false }
  ]
};

test("P1.x strict compiler and linter settings", () => {
  assert.doesNotThrow(() => assertStrictSettings({ strict: true, noImplicitAny: true, lintErrors: true }));
  assert.throws(() => assertStrictSettings({ strict: false, noImplicitAny: true, lintErrors: true }), /Strict compiler settings/);
  assert.throws(() => assertStrictSettings({ strict: true, noImplicitAny: false, lintErrors: true }), /Implicit any/);
});

test("P1.x no any escape hatches on critical contracts", () => {
  assert.doesNotThrow(() => assertNoAnyEscape({ any: false }));
  assert.doesNotThrow(() => assertNoAnyEscape({ any: true, justification: "third-party untyped payload" }));
  assert.throws(() => assertNoAnyEscape({ any: true }), /requires justification/);
});

test("P1.x schema-driven validation", () => {
  assert.equal(validateSchema(schema).fields.length, 2);
  assert.throws(() => validateSchema({ name: "X", fields: [] }), /at least one field/);
  assert.throws(() => validateSchema({ name: "X", fields: [{ name: "a", type: "string", required: true }, { name: "a", type: "number", required: true }] }), /Duplicate schema field/);
});

test("P1.x generated types from schema", () => {
  const generated = generateSchemaType(schema);
  assert.match(generated, /export interface ProjectRow/);
  assert.match(generated, /id: string;/);
  assert.match(generated, /runwayMonths\?: number;/);
});

test("P1.x database and client types stay synchronized", () => {
  const generated = generateSchemaType(schema);
  assert.doesNotThrow(() => assertTypeSync(generated, `  ${generated}  `));
  assert.throws(() => assertTypeSync(generated, "export interface ProjectRow {}"), /have drifted/);
});

test("P1.x contract drift fails CI", () => {
  assert.doesNotThrow(() => assertNoContractDrift("v1", "v1"));
  assert.throws(() => assertNoContractDrift("v1", "v2"), /Contract drift must fail CI/);
});

test("P1.x foundation rules are versioned", () => {
  assert.doesNotThrow(() => assertFoundationRulesVersioned({ version: "3", effectiveAt: T0 }));
  assert.throws(() => assertFoundationRulesVersioned({ version: "", effectiveAt: T0 }), /require a version/);
});

test("P1.x foundation changes require architecture review", () => {
  assert.doesNotThrow(() => requireArchitectureReview({ touchesFoundation: true, reviews: ["architecture", "security"] }));
  assert.doesNotThrow(() => requireArchitectureReview({ touchesFoundation: false, reviews: [] }));
  assert.throws(() => requireArchitectureReview({ touchesFoundation: true, reviews: ["tests"] }), /explicit architecture review/);
});
