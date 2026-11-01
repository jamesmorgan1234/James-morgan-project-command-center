import { type IntentClassification } from "./conversation.js";
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
export declare function voiceIntent(adapter: VoiceAdapter, transcript: VoiceTranscript): IntentClassification;
