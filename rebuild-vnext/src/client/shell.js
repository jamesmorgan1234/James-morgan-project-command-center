import { VIEW_STATE } from './view-state.js';

export class ClientShellState {
  #authenticated = false;
  #view = VIEW_STATE.IDLE;
  #online = true;
  #updateAvailable = false;

  authenticate() { this.#authenticated = true; }
  signOut() { this.#authenticated = false; this.#view = VIEW_STATE.IDLE; }
  setView(view) {
    if (!Object.values(VIEW_STATE).includes(view)) throw new TypeError(`Unknown view state: ${view}`);
    this.#view = view;
  }
  setOnline(value) { this.#online = Boolean(value); }
  setUpdateAvailable(value) { this.#updateAvailable = Boolean(value); }
  snapshot() {
    return Object.freeze({ authenticated: this.#authenticated, view: this.#view, online: this.#online, updateAvailable: this.#updateAvailable });
  }
}

export function publicShellModel(state) {
  const snapshot = state.snapshot();
  if (snapshot.authenticated) throw new TypeError('publicShellModel is signed-out only');
  return Object.freeze({ title: 'Command Center', subtitle: 'Secure owner sign in', privateDataVisible: false, online: snapshot.online, updateAvailable: snapshot.updateAvailable });
}
