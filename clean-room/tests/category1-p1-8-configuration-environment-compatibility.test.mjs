import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_RUNTIME_CONFIG_VERSION,
  validateRuntimeConfig,
  validateRuntimeStartupContract,
  validateVersionedRuntimeConfig
} from "../dist/kernel/index.js";
import { readBrowserStartupConfiguration } from "../dist/runtime/startup-config.js";

const base = {
  configVersion: CURRENT_RUNTIME_CONFIG_VERSION,
  environment: "test",
  releaseId: "rel_p1-8",
  schemaVersion: 3,
  apiVersion: 4,
  compatibleSchema: { min: 2, max: 4 },
  compatibleApi: { min: 3, max: 5 },
  features: { safeMode: true }
};

function trusted(environment = "test", releaseId = base.releaseId) {
  return {
    environment,
    releaseId,
    configurationDigest: "sha256:test-config",
    backend: {
      providerKey: "test-provider",
      environment,
      baseUrl: "https://backend.example.test",
      projectRef: "isolated-test-project",
      authIssuer: "https://backend.example.test/auth",
      authAudience: "owner"
    }
  };
}

function fakeDocument(metas) {
  return {
    baseURI: "https://command-center.example.test/",
    querySelector(selector) {
      const match = /^meta\[name="([^"]+)"\]$/.exec(selector);
      if (!match) return null;
      const value = metas[match[1]];
      return value === undefined ? null : { content: value };
    }
  };
}

function browserMetas(overrides = {}) {
  return {
    "command-center-config-version": "1",
    "command-center-environment": "production",
    "command-center-release": "rel_browser-p1-8",
    "command-center-schema-version": "1",
    "command-center-api-version": "1",
    "command-center-compatible-schema": "1-1",
    "command-center-compatible-api": "1-1",
    "command-center-features": "{\"safeMode\":true}",
    "command-center-config-digest": "sha256:browser-config",
    "command-center-backend-environment": "production",
    "command-center-supabase-url": "https://gmlsucpwliegwlxymjvp.supabase.co",
    ...overrides
  };
}

test("P1.8 requires an explicit supported config version at startup", () => {
  assert.equal(validateVersionedRuntimeConfig(base).configVersion, 1);
  assert.throws(() => validateVersionedRuntimeConfig({ ...base, configVersion: undefined }), /configVersion is required/);
  assert.throws(() => validateVersionedRuntimeConfig({ ...base, configVersion: 2 }), /Unsupported configVersion/);
});

test("P1.8 runtime config rejects invalid environments, feature flags, and compatibility values", () => {
  for (const environment of ["development", "test", "preview", "staging", "production"]) {
    assert.equal(validateRuntimeConfig({ ...base, environment }).environment, environment);
  }
  assert.throws(() => validateRuntimeConfig({ ...base, environment: "prod" }), /Invalid runtime environment/);
  assert.throws(() => validateRuntimeConfig({ ...base, features: { unsafe: "yes" } }), /must be boolean/);
  assert.throws(() => validateRuntimeConfig({ ...base, compatibleSchema: { min: 1.5, max: 4 } }), /Invalid compatibleSchema range/);
  assert.throws(() => validateRuntimeConfig({ ...base, releaseId: "__COMMAND_CENTER_RELEASE_ID__" }), /unresolved build placeholder/);
});

test("P1.8 startup contract blocks mixed environment and release identities before execution", () => {
  assert.equal(validateRuntimeStartupContract({ runtime: base, trustedEnvironment: trusted() }).runtime.releaseId, base.releaseId);
  assert.throws(
    () => validateRuntimeStartupContract({ runtime: base, trustedEnvironment: trusted("staging") }),
    /Runtime\/trusted environment mismatch blocked/
  );
  assert.throws(
    () => validateRuntimeStartupContract({ runtime: base, trustedEnvironment: trusted("test", "rel_other") }),
    /Runtime\/trusted release identity mismatch blocked/
  );
});

test("P1.8 browser startup accepts aligned production config and blocks production backend in preview", () => {
  const production = readBrowserStartupConfiguration(fakeDocument(browserMetas()));
  assert.equal(production.runtime.environment, "production");
  assert.equal(production.trustedEnvironment?.backend.classification, "protected-production");

  assert.throws(
    () => readBrowserStartupConfiguration(fakeDocument(browserMetas({ "command-center-environment": "preview" }))),
    /Runtime\/trusted environment mismatch blocked/
  );
});

test("P1.8 isolated preview runtime endpoint remains valid without binding to the production backend", () => {
  const preview = readBrowserStartupConfiguration(fakeDocument(browserMetas({
    "command-center-environment": "preview",
    "command-center-runtime-endpoint": "/__preview__/runtime.json"
  })));
  assert.equal(preview.runtime.environment, "preview");
  assert.equal(preview.trustedEnvironment, undefined);
});
