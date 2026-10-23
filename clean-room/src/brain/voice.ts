import { classifyConversationIntent, type IntentClassification } from "./conversation.js";

export interface VoiceAdapter {
  readonly key: string;
  readonly available: boolean;
  readonly permission: "granted" | "denied" | "prompt";
}

export interface VoiceTranscript {
  readonly text: string;
  readonly final: boolean;
  readonly adapterKey: string;
}

export function voiceIntent(adapter: VoiceAdapter, transcript: VoiceTranscript): IntentClassification {
  if (!adapter.available) throw new Error("Voice provider unavailable; use text interface");
  if (adapter.permission !== "granted") throw new Error("Microphone permission is not granted");
  if (!transcript.final) throw new Error("Editable/cancellable partial transcript cannot execute as final intent");
  if (transcript.adapterKey !== adapter.key) throw new Error("Voice transcript adapter mismatch");
  return classifyConversationIntent(transcript.text);
}
