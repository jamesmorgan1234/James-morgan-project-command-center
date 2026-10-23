export interface NavigationSnapshot {
  readonly currentPath: string;
  readonly history: readonly string[];
  readonly scrollByPath: Readonly<Record<string, number>>;
}

export class NavigationCoordinator {
  readonly #history: string[] = [];
  readonly #scroll = new Map<string, number>();
  #currentPath: string;

  constructor(initialPath = "/") {
    if (!initialPath.startsWith("/")) throw new Error("Initial path must be absolute");
    this.#currentPath = initialPath;
  }

  get currentPath(): string { return this.#currentPath; }

  navigate(path: string): void {
    if (!path.startsWith("/")) throw new Error("Navigation path must be absolute");
    if (path === this.#currentPath) return;
    this.#history.push(this.#currentPath);
    this.#currentPath = path;
  }

  back(fallback = "/"): string {
    const previous = this.#history.pop();
    this.#currentPath = previous ?? fallback;
    return this.#currentPath;
  }

  recordScroll(path: string, offset: number): void {
    if (!Number.isFinite(offset) || offset < 0) throw new Error("Scroll offset must be a non-negative finite number");
    this.#scroll.set(path, offset);
  }

  restoreScroll(path: string): number { return this.#scroll.get(path) ?? 0; }

  snapshot(): NavigationSnapshot {
    return Object.freeze({ currentPath: this.#currentPath, history: Object.freeze([...this.#history]), scrollByPath: Object.freeze(Object.fromEntries(this.#scroll)) });
  }
}
