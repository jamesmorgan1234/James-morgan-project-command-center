import { RegistrationError } from './errors.js';

export class Router {
  #routes;
  #history = [];
  #current = null;

  constructor(routeRegistry) { this.#routes = routeRegistry; }
  get current() { return this.#current ? structuredClone(this.#current) : null; }
  get history() { return Object.freeze(this.#history.map(structuredClone)); }

  navigate(routeId, state = {}) {
    const route = this.#routes.get(routeId);
    if (!route) throw new RegistrationError(`Unknown route: ${routeId}`);
    if (this.#current) this.#history.push(this.#current);
    this.#current = Object.freeze({ routeId, path: route.path, state: structuredClone(state) });
    return this.current;
  }

  back() {
    if (!this.#history.length) return this.current;
    this.#current = this.#history.pop();
    return this.current;
  }
}
