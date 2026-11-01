/** Voice contracts: independence from Brain logic, listening state, confirmation, providers and logging. */
export function voiceIndependence(handlers) {
    if (!handlers.brain || !handlers.voice)
        throw new Error("Voice must be independent from Brain logic");
}
export function listeningState(state) {
    if (state !== "idle" && state !== "listening")
        throw new Error("Listening state must be visible");
    return state;
}
export function ambiguityConfirmation(confidence) {
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
        throw new Error("Confidence must be a probability");
    return confidence < 0.8 ? "confirm" : "proceed";
}
export function voiceProvider(provider, supported) {
    if (!supported.includes(provider))
        throw new Error(`Unsupported voice provider: ${provider}`);
    return provider;
}
export function handsFreeSummary(summary, maxSeconds) {
    if (!summary.trim())
        throw new Error("A summary requires content");
    if (maxSeconds < 1 || maxSeconds > 120)
        throw new Error("Hands-free summaries are bounded in length");
    return summary;
}
export function voiceActionLog(originator) {
    if (originator !== "owner_voice")
        throw new Error("Voice actions are logged as owner-originated voice input");
    return originator;
}
//# sourceMappingURL=voice-contracts.js.map