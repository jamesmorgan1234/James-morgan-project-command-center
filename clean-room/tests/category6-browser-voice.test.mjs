import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { BrowserVoiceAdapterRegistry, WebSpeechRecognitionAdapter } from "../dist/runtime/browser-voice.js";

class FakeRecognition {
  static last;
  constructor() {
    FakeRecognition.last = this;
    this.interimResults = false;
    this.continuous = true;
    this.lang = "";
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.started = false;
    this.aborted = false;
  }
  start() { this.started = true; }
  abort() { this.aborted = true; this.onend?.(); }
}

function fakeWindow() {
  return { SpeechRecognition: FakeRecognition };
}

function fakeNavigator(permission = "granted") {
  let stopped = 0;
  return {
    language: "en-US",
    get stopped() { return stopped; },
    mediaDevices: {
      async getUserMedia() {
        if (permission !== "granted") throw new Error("denied");
        return { getTracks: () => [{ stop() { stopped += 1; } }] };
      }
    }
  };
}

test("P6.12 voice adapter registry is replaceable and duplicate-safe", () => {
  const registry = new BrowserVoiceAdapterRegistry();
  const adapter = { key: "speech:test", label: "Test", available: true, async start() { return { cancel() {} }; } };
  const unregister = registry.register(adapter);
  assert.equal(registry.firstAvailable(), adapter);
  assert.throws(() => registry.register(adapter), /already registered/);
  unregister();
  assert.equal(registry.get("speech:test"), undefined);
});

test("P6.12 Web Speech adapter requests microphone permission, exposes partial/final transcript, and cancels", async () => {
  const navigatorRef = fakeNavigator();
  const adapter = new WebSpeechRecognitionAdapter(fakeWindow(), navigatorRef);
  assert.equal(adapter.available, true);
  const events = [];
  const capture = await adapter.start({
    partial: (text) => events.push(["partial", text]),
    final: (text) => events.push(["final", text]),
    error: (message) => events.push(["error", message]),
    ended: () => events.push(["ended"])
  });
  const recognition = FakeRecognition.last;
  assert.equal(recognition.started, true);
  assert.equal(recognition.interimResults, true);
  assert.equal(recognition.continuous, false);
  assert.equal(navigatorRef.stopped, 1);
  recognition.onresult({ results: [
    { isFinal: false, 0: { transcript: "  partial   words " } },
    { isFinal: true, 0: { transcript: " final words " } }
  ] });
  assert.deepEqual(events.slice(0, 2), [["partial", "partial words"], ["final", "final words"]]);
  capture.cancel();
  assert.equal(recognition.aborted, true);
});

test("P6.12 denied microphone permission fails closed while preserving text fallback", async () => {
  const adapter = new WebSpeechRecognitionAdapter(fakeWindow(), fakeNavigator("denied"));
  await assert.rejects(() => adapter.start({ partial() {}, final() {}, error() {} }), /Text input remains available/i);
});

test("P6.12 Brain composer requires review/edit before persistence and never auto-submits a final transcript", async () => {
  const source = await readFile(new URL("../src/runtime/brain-view.ts", import.meta.url), "utf8");
  assert.match(source, /Use microphone/);
  assert.match(source, /Cancel voice/);
  assert.match(source, /Final transcript ready\. Review or edit it before persisting; voice never auto-submits\./);
  assert.match(source, /active\.cancel\(\)/);
  assert.match(source, /input\.value = preVoiceText/);
  const finalHandler = source.match(/final: \(text\) => \{[\s\S]*?\n\s*\},\n\s*error:/)?.[0] ?? "";
  assert.match(finalHandler, /input\.value = mergeVoiceTranscript/);
  assert.doesNotMatch(finalHandler, /requestSubmit|dispatchEvent|recordBrainOwnerTurn|form\.submit/);
});
