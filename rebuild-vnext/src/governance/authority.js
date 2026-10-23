import { RegistrationError } from '../kernel/errors.js';

const DEFAULT_AUTHORITY = Object.freeze([
  'owner_instruction',
  'verified_live_provider',
  'verified_repository',
  'verified_database',
  'approved_asset',
  'verified_file',
  'historical_chat',
  'historical_roadmap',
  'inference'
]);

export class AuthorityRegistry {
  #types = new Map();
  constructor(order = DEFAULT_AUTHORITY) {
    order.forEach((id, priority) => this.register(id, { priority }));
  }

  register(id, { priority }) {
    if (this.#types.has(id)) throw new RegistrationError(`Authority type already registered: ${id}`);
    this.#types.set(id, Object.freeze({ priority }));
  }

  compare(a, b) {
    const left = this.#types.get(a.type);
    const right = this.#types.get(b.type);
    if (!left || !right) throw new RegistrationError('Unknown authority type', { a: a.type, b: b.type });
    if (a.dimension && b.dimension && a.dimension !== b.dimension) return 'conflict';
    if (a.type === 'owner_instruction' && b.type === 'owner_instruction') {
      if (a.explicit !== b.explicit) return a.explicit ? 'left' : 'right';
      if ((a.sequence ?? 0) === (b.sequence ?? 0)) return 'conflict';
      return (a.sequence ?? 0) > (b.sequence ?? 0) ? 'left' : 'right';
    }
    if (left.priority === right.priority) return 'conflict';
    return left.priority < right.priority ? 'left' : 'right';
  }

  resolve(records) {
    if (!records.length) return { status: 'unknown', winner: null, conflicts: [] };
    let winner = records[0];
    const conflicts = [];
    for (const candidate of records.slice(1)) {
      const result = this.compare(winner, candidate);
      if (result === 'right') winner = candidate;
      if (result === 'conflict') conflicts.push(candidate);
    }
    return Object.freeze({ status: conflicts.length ? 'conflicted' : 'resolved', winner, conflicts });
  }
}

export { DEFAULT_AUTHORITY };
