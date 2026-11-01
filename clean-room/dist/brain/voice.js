import { classifyConversationIntent } from "./conversation.js";
export function voiceIntent(adapter, transcript) {
    if (!adapter.available)
        throw new Error("Voice provider unavailable; use text interface");
    if (adapter.permission !== "granted")
        throw new Error("Microphone permission is not granted");
    if (!transcript.final)
        throw new Error("Editable/cancellable partial transcript cannot execute as final intent");
    if (transcript.adapterKey !== adapter.key)
        throw new Error("Voice transcript adapter mismatch");
    return classifyConversationIntent(transcript.text);
}
//# sourceMappingURL=voice.js.map