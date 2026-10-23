import { createDisconnectedRuntimeSnapshot, type CommandCenterRuntimeSnapshot } from "./snapshot.js";

export interface RuntimeSnapshotProvider {
  readonly id: string;
  load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot>;
}

export class DisconnectedRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
  readonly id: string;
  constructor(id = "runtime:disconnected") { this.id = id; }
  async load(): Promise<CommandCenterRuntimeSnapshot> { return createDisconnectedRuntimeSnapshot(this.id); }
}

export interface HttpRuntimeSnapshotProviderOptions {
  readonly endpoint: string;
  readonly fetcher?: typeof fetch;
  readonly timeoutMs?: number;
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }

function isRuntimeSnapshot(value: unknown): value is CommandCenterRuntimeSnapshot {
  if (!isObject(value) || value.schemaVersion !== "cc-runtime-snapshot-v1") return false;
  if (typeof value.generatedAt !== "string" || !isObject(value.connection) || !Array.isArray(value.projects) || !Array.isArray(value.surfaces)) return false;
  const state = value.connection.state;
  return state === "connected" || state === "disconnected" || state === "degraded" || state === "stale";
}

export class HttpRuntimeSnapshotProvider implements RuntimeSnapshotProvider {
  readonly id = "runtime:http";
  readonly #endpoint: string;
  readonly #fetcher: typeof fetch;
  readonly #timeoutMs: number;

  constructor(options: HttpRuntimeSnapshotProviderOptions) {
    const endpoint = options.endpoint.trim();
    if (!endpoint) throw new Error("Runtime endpoint is required");
    this.#endpoint = endpoint;
    this.#fetcher = options.fetcher ?? fetch;
    this.#timeoutMs = options.timeoutMs ?? 8000;
  }

  async load(signal?: AbortSignal): Promise<CommandCenterRuntimeSnapshot> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    const relayAbort = (): void => controller.abort();
    signal?.addEventListener("abort", relayAbort, { once: true });
    try {
      const response = await this.#fetcher(this.#endpoint, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal
      });
      if (!response.ok) return createDisconnectedRuntimeSnapshot(this.id);
      const payload: unknown = await response.json();
      return isRuntimeSnapshot(payload) ? payload : createDisconnectedRuntimeSnapshot(this.id);
    } catch {
      return createDisconnectedRuntimeSnapshot(this.id);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", relayAbort);
    }
  }
}

export function providerFromDocument(documentRef: Document): RuntimeSnapshotProvider {
  const endpoint = documentRef.querySelector<HTMLMetaElement>('meta[name="command-center-runtime-endpoint"]')?.content.trim();
  return endpoint ? new HttpRuntimeSnapshotProvider({ endpoint }) : new DisconnectedRuntimeSnapshotProvider();
}
