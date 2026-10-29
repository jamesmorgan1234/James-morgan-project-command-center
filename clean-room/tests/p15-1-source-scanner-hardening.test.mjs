import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const legacyScanner = fileURLToPath(new URL("../scripts/check-no-legacy-imports.mjs", import.meta.url));
const architectureScanner = fileURLToPath(new URL("../scripts/check-architecture-contracts.mjs", import.meta.url));

async function withFixture(files, run) {
  const root = await mkdtemp(join(tmpdir(), "cc-p15-1-scanner-"));
  try {
    for (const [relative, content] of Object.entries(files)) {
      const path = join(root, relative);
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, content, "utf8");
    }
    return run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function scan(script, root) {
  return spawnSync(process.execPath, [script, root], { encoding: "utf8" });
}

test("P15.1 legacy scanner rejects multiline static, re-export, dynamic import and require specifiers", async () => {
  await withFixture({
    "fixture.ts": `
      import {
        unsafe
      } from "../legacy/runtime.js";
      export {
        other
      } from "./archive/legacy-module.js";
      async function load() {
        await import(
          "../old-agent/worker.js"
        );
      }
      const required = require(
        "./cc7_agent_runtime.js"
      );
      void unsafe; void other; void required;
    `
  }, (root) => {
    const result = scan(legacyScanner, root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /\.\.\/legacy\/runtime\.js/);
    assert.match(result.stderr, /archive\/legacy-module\.js/);
    assert.match(result.stderr, /old-agent\/worker\.js/);
    assert.match(result.stderr, /cc7_agent_runtime\.js/);
  });
});

test("P15.1 legacy scanner ignores comments and ordinary string lookalikes", async () => {
  await withFixture({
    "fixture.ts": `
      // import { nope } from "../legacy/runtime.js";
      const example = "require('../legacy/runtime.js')";
      const documentation = "import('../old-agent/worker.js')";
      export { example, documentation };
    `
  }, (root) => {
    const result = scan(legacyScanner, root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /PASS: no legacy runtime imports/);
  });
});

test("P15.1 architecture scanner rejects multiline native prototype patches", async () => {
  await withFixture({
    "fixture.ts": `
      Object.defineProperty(
        HTMLElement.prototype,
        "dangerous",
        { value: true }
      );
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /native prototype defineProperty patch/);
  });
});

test("P15.1 architecture scanner rejects bracketed prototype assignment and multiline document writes", async () => {
  await withFixture({
    "fixture.ts": `
      HTMLElement["prototype"]["dangerous"] = true;
      document[
        "write"
      ]("unsafe");
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /native prototype assignment/);
    assert.match(result.stderr, /document\.write runtime patch/);
  });
});

test("P15.1 architecture scanner rejects multiline incremental innerHTML but ignores comment/string lookalikes", async () => {
  await withFixture({
    "fixture.ts": `
      const example = "HTMLElement.prototype.fake = true";
      // Object.defineProperty(HTMLElement.prototype, "fake", {});
      element[
        "innerHTML"
      ] += "unsafe";
      void example;
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /incremental innerHTML patch/);
    assert.doesNotMatch(result.stderr, /native prototype/);
  });
});

test("P15.1 architecture scanner rejects static relative import and re-export cycles", async () => {
  await withFixture({
    "a.ts": `
      import { b } from "./b.js";
      export const a = b;
    `,
    "b.ts": `
      export { a } from "./a.js";
      export const b = 1;
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /import cycle:/);
    assert.match(result.stderr, /a\.ts/);
    assert.match(result.stderr, /b\.ts/);
  });
});

test("P15.1 architecture scanner accepts an acyclic relative import graph", async () => {
  await withFixture({
    "a.ts": `
      import { b } from "./b.js";
      export const a = b;
    `,
    "b.ts": `
      export const b = 1;
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /no prohibited runtime patch patterns or static relative import cycles/);
  });
});

test("P15.1 architecture scanner accepts benign source containing policy text only", async () => {
  await withFixture({
    "fixture.ts": `
      const notes = [
        "document.write(runtime)",
        "Array.prototype.fake = value",
        "Object.defineProperty(HTMLElement.prototype, name, descriptor)"
      ];
      export { notes };
    `
  }, (root) => {
    const result = scan(architectureScanner, root);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /PASS: architecture source contains no prohibited runtime patch patterns/);
  });
});
