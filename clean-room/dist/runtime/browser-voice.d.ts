export interface BrowserVoiceCaptureCallbacks {
    readonly partial: (text: string) => void;
    readonly final: (text: string) => void;
    readonly error: (message: string) => void;
    readonly ended?: () => void;
}
export interface BrowserVoiceCapture {
    cancel(): void;
}
export interface BrowserVoiceAdapter {
    readonly key: string;
    readonly label: string;
    readonly available: boolean;
    start(callbacks: BrowserVoiceCaptureCallbacks): Promise<BrowserVoiceCapture>;
}
export declare class BrowserVoiceAdapterRegistry {
    #private;
    register(adapter: BrowserVoiceAdapter): () => void;
    get(key: string): BrowserVoiceAdapter | undefined;
    list(): readonly BrowserVoiceAdapter[];
    firstAvailable(): BrowserVoiceAdapter | undefined;
}
export declare class WebSpeechRecognitionAdapter implements BrowserVoiceAdapter {
    #private;
    readonly key = "speech:web-speech";
    readonly label = "Device speech recognition";
    constructor(windowRef?: Window & typeof globalThis, navigatorRef?: Navigator);
    get available(): boolean;
    start(callbacks: BrowserVoiceCaptureCallbacks): Promise<BrowserVoiceCapture>;
}
export declare function createDefaultBrowserVoiceRegistry(windowRef?: Window & typeof globalThis, navigatorRef?: Navigator): BrowserVoiceAdapterRegistry;
