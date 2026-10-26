import test from "node:test";
import assert from "node:assert/strict";
import { LocalizationRegistry, canonicalizeLocale } from "../dist/kernel/index.js";

const catalogs = {
  "en-US": {
    "nav.home": "Home",
    "status.ready": "Ready"
  },
  en: {
    "nav.home": "Home (language fallback)"
  },
  es: {
    "nav.home": "Inicio"
  }
};

test("P1 localization-ready structure canonicalizes locales and resolves exact catalogs", () => {
  const registry = new LocalizationRegistry("en-US", catalogs);
  assert.equal(canonicalizeLocale("EN-us"), "en-US");
  assert.deepEqual(registry.supportedLocales(), ["en", "en-US", "es"]);
  assert.equal(registry.defaultLocale(), "en-US");
  assert.equal(registry.hasLocale("ES"), true);
  assert.deepEqual(registry.resolve("es", "nav.home"), {
    key: "nav.home",
    value: "Inicio",
    requestedLocale: "es",
    resolvedLocale: "es",
    usedFallback: false
  });
});

test("P1 localization-ready structure uses deterministic language then default fallbacks", () => {
  const registry = new LocalizationRegistry("en-US", catalogs);
  assert.deepEqual(registry.resolve("en-GB", "nav.home"), {
    key: "nav.home",
    value: "Home (language fallback)",
    requestedLocale: "en-GB",
    resolvedLocale: "en",
    usedFallback: true
  });
  assert.deepEqual(registry.resolve("fr-CA", "status.ready"), {
    key: "status.ready",
    value: "Ready",
    requestedLocale: "fr-CA",
    resolvedLocale: "en-US",
    usedFallback: true
  });
});

test("P1 localization-ready structure fails closed on invalid catalogs, locales, and missing keys", () => {
  assert.throws(() => canonicalizeLocale("not_a_locale"), /Invalid locale/);
  assert.throws(() => new LocalizationRegistry("fr", catalogs), /Default locale catalog is required/);
  assert.throws(() => new LocalizationRegistry("en-US", { "en-us": { "nav.home": "Home" }, "en-US": { "nav.home": "Duplicate" } }), /Duplicate canonical locale/);
  assert.throws(() => new LocalizationRegistry("en-US", { "en-US": { "": "bad" } }), /translation key/);
  assert.throws(() => new LocalizationRegistry("en-US", { "en-US": { "nav.home": "" } }), /Translation value is required/);
  const registry = new LocalizationRegistry("en-US", catalogs);
  assert.throws(() => registry.resolve("es", "missing.key"), /Missing translation key/);
});
