export interface CommandCenterHistoryState {
  readonly commandCenter: true;
  readonly locationKey: string;
  readonly scrollY: number;
  readonly sequence: number;
}

export interface BrowserHistoryPort {
  state: unknown;
  length: number;
  scrollRestoration: "auto" | "manual";
  pushState(data: unknown, unused: string, url?: string | URL | null): void;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  back(): void;
}

export interface BrowserLocationPort {
  readonly pathname: string;
  readonly search: string;
}

export interface BrowserScrollPort {
  read(): number;
  restore(offset: number): void;
}

function assertOffset(offset: number): number {
  if (!Number.isFinite(offset) || offset < 0) throw new Error("Scroll offset must be a non-negative finite number");
  return offset;
}

function assertPath(path: string): string {
  if (!path.startsWith("/")) throw new Error("Navigation path must be absolute");
  return path;
}

export function browserLocationKey(location: BrowserLocationPort): string {
  const pathname = location.pathname.startsWith("/") ? location.pathname : `/${location.pathname}`;
  return `${pathname}${location.search ?? ""}`;
}

export function readCommandCenterHistoryState(value: unknown): CommandCenterHistoryState | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<CommandCenterHistoryState>;
  if (candidate.commandCenter !== true) return undefined;
  if (typeof candidate.locationKey !== "string" || !candidate.locationKey.startsWith("/")) return undefined;
  if (typeof candidate.scrollY !== "number" || !Number.isFinite(candidate.scrollY) || candidate.scrollY < 0) return undefined;
  if (typeof candidate.sequence !== "number" || !Number.isSafeInteger(candidate.sequence) || candidate.sequence < 0) return undefined;
  return Object.freeze({ commandCenter: true, locationKey: candidate.locationKey, scrollY: candidate.scrollY, sequence: candidate.sequence });
}

export class BrowserNavigationCoordinator {
  #sequence = 0;

  constructor(
    readonly history: BrowserHistoryPort,
    readonly location: BrowserLocationPort,
    readonly scroll: BrowserScrollPort
  ) {}

  initialize(): CommandCenterHistoryState {
    this.history.scrollRestoration = "manual";
    const current = readCommandCenterHistoryState(this.history.state);
    if (current) this.#sequence = current.sequence;
    const state = this.#state(browserLocationKey(this.location), this.scroll.read(), this.#sequence);
    this.history.replaceState(state, "", browserLocationKey(this.location));
    return state;
  }

  captureCurrent(): CommandCenterHistoryState {
    const current = readCommandCenterHistoryState(this.history.state);
    if (current) this.#sequence = Math.max(this.#sequence, current.sequence);
    const state = this.#state(browserLocationKey(this.location), this.scroll.read(), this.#sequence);
    this.history.replaceState(state, "", browserLocationKey(this.location));
    return state;
  }

  navigate(path: string): CommandCenterHistoryState {
    const target = assertPath(path);
    this.captureCurrent();
    this.#sequence += 1;
    const state = this.#state(target, 0, this.#sequence);
    this.history.pushState(state, "", target);
    this.scroll.restore(0);
    return state;
  }

  back(fallback = "/"): "history" | "fallback" {
    const safeFallback = assertPath(fallback);
    this.captureCurrent();
    if (this.history.length > 1) {
      this.history.back();
      return "history";
    }
    this.navigate(safeFallback);
    return "fallback";
  }

  restore(state: unknown): number {
    const parsed = readCommandCenterHistoryState(state);
    const offset = parsed && parsed.locationKey === browserLocationKey(this.location) ? parsed.scrollY : 0;
    this.scroll.restore(offset);
    if (parsed) this.#sequence = Math.max(this.#sequence, parsed.sequence);
    return offset;
  }

  #state(locationKey: string, scrollY: number, sequence: number): CommandCenterHistoryState {
    return Object.freeze({ commandCenter: true as const, locationKey: assertPath(locationKey), scrollY: assertOffset(scrollY), sequence });
  }
}
