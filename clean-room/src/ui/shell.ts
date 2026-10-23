export type ShellState = "cold" | "starting" | "hydrating" | "ready" | "offline_ready" | "degraded" | "failed";

const ALLOWED = {
  cold: ["starting"],
  starting: ["hydrating", "failed"],
  hydrating: ["ready", "offline_ready", "degraded", "failed"],
  ready: ["offline_ready", "degraded", "failed"],
  offline_ready: ["ready", "degraded", "failed"],
  degraded: ["ready", "offline_ready", "failed"],
  failed: ["starting"]
} as const satisfies Readonly<Record<ShellState, readonly ShellState[]>>;

export interface ShellModuleMount {
  readonly slot: string;
  readonly moduleKey: string;
}

export class ApplicationShell {
  #state: ShellState = "cold";
  readonly #mounts = new Map<string, ShellModuleMount>();

  get state(): ShellState { return this.#state; }

  transition(to: ShellState): void {
    if (!(ALLOWED[this.#state] as readonly ShellState[]).includes(to)) throw new Error(`Invalid shell transition: ${this.#state} -> ${to}`);
    this.#state = to;
  }

  mount(mount: ShellModuleMount): void {
    if (!mount.slot.trim() || !mount.moduleKey.trim()) throw new Error("Shell slot and moduleKey are required");
    if (this.#mounts.has(mount.slot)) throw new Error(`Shell slot already has an owner: ${mount.slot}`);
    this.#mounts.set(mount.slot, Object.freeze({ ...mount }));
  }

  unmount(slot: string, moduleKey: string): void {
    const current = this.#mounts.get(slot);
    if (!current) throw new Error(`Unknown shell slot: ${slot}`);
    if (current.moduleKey !== moduleKey) throw new Error(`Module ${moduleKey} does not own shell slot ${slot}`);
    this.#mounts.delete(slot);
  }

  listMounts(): readonly ShellModuleMount[] { return Object.freeze([...this.#mounts.values()]); }
}
