import { StateTransitionError } from './errors.js';

export class StateMachine {
  #state;
  #transitions;
  #version;
  #history = [];

  constructor({ initialState, transitions, version = 1 }) {
    if (!initialState) throw new TypeError('initialState is required');
    this.#state = initialState;
    this.#version = version;
    this.#transitions = new Map(
      Object.entries(transitions ?? {}).map(([from, targets]) => [from, new Set(targets)])
    );
    this.#history.push(Object.freeze({ from: null, to: initialState, reason: 'initialize', at: Date.now(), version }));
  }

  get state() { return this.#state; }
  get version() { return this.#version; }
  get history() { return Object.freeze([...this.#history]); }

  canTransition(to) {
    return this.#transitions.get(this.#state)?.has(to) ?? false;
  }

  transition(to, { reason, initiator = 'system', evidence = null } = {}) {
    if (!this.canTransition(to)) {
      throw new StateTransitionError(`Cannot transition ${this.#state} -> ${to}`, {
        from: this.#state, to, version: this.#version
      });
    }
    if (!reason) throw new TypeError('transition reason is required');
    const entry = Object.freeze({
      from: this.#state,
      to,
      reason,
      initiator,
      evidence,
      at: Date.now(),
      version: this.#version
    });
    this.#state = to;
    this.#history.push(entry);
    return entry;
  }
}

export const APPLICATION_LIFECYCLE = Object.freeze({
  version: 1,
  initialState: 'created',
  transitions: Object.freeze({
    created: ['bootstrapping'],
    bootstrapping: ['ready', 'degraded', 'recovery_required', 'stopped'],
    ready: ['degraded', 'recovery_required', 'stopped'],
    degraded: ['ready', 'recovery_required', 'stopped'],
    recovery_required: ['bootstrapping', 'stopped'],
    stopped: []
  })
});
