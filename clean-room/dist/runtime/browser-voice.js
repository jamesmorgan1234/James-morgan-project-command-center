function normalizeTranscript(value) {
    return value.replace(/\s+/gu, " ").trim();
}
function recognitionConstructor(windowRef) {
    return windowRef.SpeechRecognition ?? windowRef.webkitSpeechRecognition;
}
export class BrowserVoiceAdapterRegistry {
    #adapters = new Map();
    register(adapter) {
        const key = adapter.key.trim();
        if (!key || !adapter.label.trim())
            throw new Error("Voice adapter requires a key and label");
        if (this.#adapters.has(key))
            throw new Error(`Voice adapter already registered: ${key}`);
        this.#adapters.set(key, adapter);
        return () => { this.#adapters.delete(key); };
    }
    get(key) {
        return this.#adapters.get(key);
    }
    list() {
        return Object.freeze([...this.#adapters.values()]);
    }
    firstAvailable() {
        return this.list().find((adapter) => adapter.available);
    }
}
export class WebSpeechRecognitionAdapter {
    key = "speech:web-speech";
    label = "Device speech recognition";
    #window;
    #navigator;
    constructor(windowRef = window, navigatorRef = navigator) {
        this.#window = windowRef;
        this.#navigator = navigatorRef;
    }
    get available() {
        return !!recognitionConstructor(this.#window) && !!this.#navigator.mediaDevices?.getUserMedia;
    }
    async start(callbacks) {
        const Recognition = recognitionConstructor(this.#window);
        if (!Recognition || !this.#navigator.mediaDevices?.getUserMedia)
            throw new Error("Speech recognition is unavailable; use text input");
        let permissionStream;
        try {
            permissionStream = await this.#navigator.mediaDevices.getUserMedia({ audio: true });
        }
        catch {
            throw new Error("Microphone permission was not granted; text input remains available");
        }
        for (const track of permissionStream.getTracks())
            track.stop();
        const recognition = new Recognition();
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.lang = this.#navigator.language || "en-US";
        let cancelled = false;
        let ended = false;
        recognition.onresult = (event) => {
            if (cancelled)
                return;
            const partials = [];
            const finals = [];
            for (let index = 0; index < event.results.length; index += 1) {
                const result = event.results[index];
                const transcript = normalizeTranscript(result?.[0]?.transcript ?? "");
                if (!transcript)
                    continue;
                if (result?.isFinal)
                    finals.push(transcript);
                else
                    partials.push(transcript);
            }
            if (partials.length)
                callbacks.partial(normalizeTranscript(partials.join(" ")));
            if (finals.length)
                callbacks.final(normalizeTranscript(finals.join(" ")));
        };
        recognition.onerror = (event) => {
            if (cancelled)
                return;
            callbacks.error(event.error ? `Speech provider error: ${event.error}` : "Speech provider failed; text input remains available");
        };
        recognition.onend = () => {
            if (ended)
                return;
            ended = true;
            callbacks.ended?.();
        };
        try {
            recognition.start();
        }
        catch {
            throw new Error("Speech recognition could not start; text input remains available");
        }
        return Object.freeze({
            cancel() {
                if (cancelled || ended)
                    return;
                cancelled = true;
                recognition.abort();
                callbacks.ended?.();
            }
        });
    }
}
export function createDefaultBrowserVoiceRegistry(windowRef = window, navigatorRef = navigator) {
    const registry = new BrowserVoiceAdapterRegistry();
    registry.register(new WebSpeechRecognitionAdapter(windowRef, navigatorRef));
    return registry;
}
//# sourceMappingURL=browser-voice.js.map