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

type SpeechRecognitionResultLike = Readonly<{
  isFinal: boolean;
  readonly 0?: Readonly<{ transcript?: string }>;
}>;

type SpeechRecognitionEventLike = Readonly<{
  results: ArrayLike<SpeechRecognitionResultLike>;
}>;

type SpeechRecognitionErrorLike = Readonly<{
  error?: string;
}>;

interface SpeechRecognitionLike {
  interimResults: boolean;
  continuous: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type VoiceWindow = Window & typeof globalThis & Readonly<{
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}>;

function normalizeTranscript(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function recognitionConstructor(windowRef: VoiceWindow): SpeechRecognitionConstructor | undefined {
  return windowRef.SpeechRecognition ?? windowRef.webkitSpeechRecognition;
}

export class BrowserVoiceAdapterRegistry {
  readonly #adapters = new Map<string, BrowserVoiceAdapter>();

  register(adapter: BrowserVoiceAdapter): () => void {
    const key = adapter.key.trim();
    if (!key || !adapter.label.trim()) throw new Error("Voice adapter requires a key and label");
    if (this.#adapters.has(key)) throw new Error(`Voice adapter already registered: ${key}`);
    this.#adapters.set(key, adapter);
    return () => { this.#adapters.delete(key); };
  }

  get(key: string): BrowserVoiceAdapter | undefined {
    return this.#adapters.get(key);
  }

  list(): readonly BrowserVoiceAdapter[] {
    return Object.freeze([...this.#adapters.values()]);
  }

  firstAvailable(): BrowserVoiceAdapter | undefined {
    return this.list().find((adapter) => adapter.available);
  }
}

export class WebSpeechRecognitionAdapter implements BrowserVoiceAdapter {
  readonly key = "speech:web-speech";
  readonly label = "Device speech recognition";
  readonly #window: VoiceWindow;
  readonly #navigator: Navigator;

  constructor(windowRef: Window & typeof globalThis = window, navigatorRef: Navigator = navigator) {
    this.#window = windowRef as VoiceWindow;
    this.#navigator = navigatorRef;
  }

  get available(): boolean {
    return !!recognitionConstructor(this.#window) && !!this.#navigator.mediaDevices?.getUserMedia;
  }

  async start(callbacks: BrowserVoiceCaptureCallbacks): Promise<BrowserVoiceCapture> {
    const Recognition = recognitionConstructor(this.#window);
    if (!Recognition || !this.#navigator.mediaDevices?.getUserMedia) throw new Error("Speech recognition is unavailable; use text input");

    let permissionStream: MediaStream;
    try {
      permissionStream = await this.#navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error("Microphone permission was not granted; text input remains available");
    }
    for (const track of permissionStream.getTracks()) track.stop();

    const recognition = new Recognition();
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.lang = this.#navigator.language || "en-US";
    let cancelled = false;
    let ended = false;

    recognition.onresult = (event) => {
      if (cancelled) return;
      const partials: string[] = [];
      const finals: string[] = [];
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = normalizeTranscript(result?.[0]?.transcript ?? "");
        if (!transcript) continue;
        if (result?.isFinal) finals.push(transcript);
        else partials.push(transcript);
      }
      if (partials.length) callbacks.partial(normalizeTranscript(partials.join(" ")));
      if (finals.length) callbacks.final(normalizeTranscript(finals.join(" ")));
    };
    recognition.onerror = (event) => {
      if (cancelled) return;
      callbacks.error(event.error ? `Speech provider error: ${event.error}` : "Speech provider failed; text input remains available");
    };
    recognition.onend = () => {
      if (ended) return;
      ended = true;
      callbacks.ended?.();
    };

    try {
      recognition.start();
    } catch {
      throw new Error("Speech recognition could not start; text input remains available");
    }

    return Object.freeze({
      cancel(): void {
        if (cancelled || ended) return;
        cancelled = true;
        recognition.abort();
        callbacks.ended?.();
      }
    });
  }
}

export function createDefaultBrowserVoiceRegistry(windowRef: Window & typeof globalThis = window, navigatorRef: Navigator = navigator): BrowserVoiceAdapterRegistry {
  const registry = new BrowserVoiceAdapterRegistry();
  registry.register(new WebSpeechRecognitionAdapter(windowRef, navigatorRef));
  return registry;
}
