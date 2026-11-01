/** Voice contracts: independence from Brain logic, listening state, confirmation, providers and logging. */

export function voiceIndependence(handlers: { readonly brain: boolean; readonly voice: boolean }): void {
  if (!handlers.brain || !handlers.voice) throw new Error("Voice must be independent from Brain logic");
}

export function listeningState(state: "idle" | "listening"): string {
  if (state !== "idle" && state !== "listening") throw new Error("Listening state must be visible");
  return state;
}

export function ambiguityConfirmation(confidence: number): "confirm" | "proceed" {
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error("Confidence must be a probability");
  return confidence < 0.8 ? "confirm" : "proceed";
}

export function voiceProvider(provider: string, supported: readonly string[]): string {
  if (!supported.includes(provider)) throw new Error(`Unsupported voice provider: ${provider}`);
  return provider;
}

export function handsFreeSummary(summary: string, maxSeconds: number): string {
  if (!summary.trim()) throw new Error("A summary requires content");
  if (maxSeconds < 1 || maxSeconds > 120) throw new Error("Hands-free summaries are bounded in length");
  return summary;
}

export function voiceActionLog(originator: string): string {
  if (originator !== "owner_voice") throw new Error("Voice actions are logged as owner-originated voice input");
  return originator;
}
