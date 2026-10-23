import { RegistrationError } from '../kernel/errors.js';

export class CommandGraph {
  #nodes = new Map();
  #edges = new Map();

  addNode({ id, type, label, provenance }) {
    if (!id || !type || !provenance) throw new RegistrationError('Graph node requires id, type, provenance');
    if (this.#nodes.has(id)) throw new RegistrationError(`Duplicate graph node: ${id}`);
    const node = Object.freeze({ id, type, label: label ?? id, provenance: structuredClone(provenance) });
    this.#nodes.set(id, node);
    return node;
  }

  addEdge({ id, from, to, type, provenance, confidence = 1, verificationState = 'verified' }) {
    if (!this.#nodes.has(from) || !this.#nodes.has(to)) throw new RegistrationError(`Graph edge references unknown node`, { from, to });
    if (this.#edges.has(id)) throw new RegistrationError(`Duplicate graph edge: ${id}`);
    if (verificationState === 'verified' && confidence < 1) throw new RegistrationError('Inferred edge cannot silently become verified');
    const edge = Object.freeze({ id, from, to, type, provenance: structuredClone(provenance), confidence, verificationState });
    this.#edges.set(id, edge);
    return edge;
  }

  outgoing(id, type = null) { return Object.freeze([...this.#edges.values()].filter(e => e.from === id && (!type || e.type === type))); }
  incoming(id, type = null) { return Object.freeze([...this.#edges.values()].filter(e => e.to === id && (!type || e.type === type))); }
  dependsOn(id) { return this.outgoing(id, 'depends_on'); }
  impactOf(id) { return this.incoming(id, 'depends_on'); }
}
