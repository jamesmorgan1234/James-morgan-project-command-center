import { getApplicationRuntime } from '../src/index.js';
import { ClientShellState, publicShellModel } from '../src/client/shell.js';

const runtime = getApplicationRuntime();
const state = new ClientShellState();
const model = publicShellModel(state);
const status = document.querySelector('#cc-status-text');
if (status) status.textContent = navigator.onLine ? model.title + ' private shell ready' : 'Offline — private shell only';

window.addEventListener('online', () => state.setOnline(true));
window.addEventListener('offline', () => state.setOnline(false));

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch(() => {
    if (status) status.textContent = 'PWA worker unavailable — shell still safe';
  });
}

void runtime;
