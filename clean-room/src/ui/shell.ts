export type ShellState = "cold" | "starting" | "hydrating" | "ready" | "offline_ready" | "degraded" | "failed";

const ALLOWED: Readonly<Record<ShellState, readonly ShellState[]>> = Object.freeze({
  cold: Object.freeze(["starting"]),
  starting: Object.freeze(["hydrating", "failed"]),
  hydrating: Object.freeze(["ready", "offline_ready", "degraded", "failed"]),
  ready: Object.freeze(["offline_ready", "degraded", "failed"]),
  offline_ready: Object.freeze(["ready", "degraded", "failed"]),
  degraded: Object.freeze(["ready", "offline_ready", "failed"]),
  failed: Object.freeze(["starting"])
});

export interface ShellModuleMount {
  readonly slot: string;
  readonly moduleKey: string;
}

export class ApplicationShell {
  #state: ShellState = "cold";
  readonly #mounts = new Map<string, ShellModuleMount>();

  get state(): ShellState { return this.#state; }

  transition(to: ShellState): void {
    if (!ALLOWED[this.#state].includes(to)) throw new Error(`Invalid shell transition: ${this.#state} -> ${to}`);
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
