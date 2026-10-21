(() => {
  const SUPABASE_SOURCES = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',
    'https://unpkg.com/@supabase/supabase-js@2.118.0/dist/umd/supabase.js'
  ];
  const CORE_SCRIPTS = [
    './app.js?v=10',
    './project-hub.js?v=3',
    './mobile-accordion-polish.js?v=1'
  ];
  let starting = false;

  const $ = id => document.getElementById(id);

  function revealShell(message = 'Starting secure connection…') {
    const boot = $('boot');
    const app = $('app');
    if (boot) boot.hidden = true;
    if (app) app.hidden = false;
    const sync = $('syncText');
    if (sync) sync.textContent = message;
  }

  function removeRecovery() {
    $('startupRecovery')?.remove();
  }

  function showRecovery(message) {
    revealShell('Secure connection unavailable · retry ready');
    let panel = $('startupRecovery');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'startupRecovery';
      panel.className = 'panel auth-panel';
      const main = document.querySelector('#app main');
      main?.prepend(panel);
    }
    if (!panel) return;
    panel.innerHTML = `
      <h2>Command Center could not finish starting</h2>
      <p class="muted">${String(message || 'The secure connection library did not load.').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}</p>
      <button id="retryStartupBtn" class="btn btn-primary">Retry secure startup</button>`;
    $('retryStartupBtn')?.addEventListener('click', () => start(true), { once: true });
  }

  function loadScript(src, timeoutMs = 7000) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src === new URL(src, location.href).href && s.dataset.ccLoaded === '1');
      if (existing) { resolve(existing); return; }
      const script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.dataset.ccStartup = '1';
      let settled = false;
      const finish = (ok, error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        script.onload = script.onerror = null;
        if (ok) {
          script.dataset.ccLoaded = '1';
          resolve(script);
        } else {
          script.remove();
          reject(error || new Error(`Failed to load ${src}`));
        }
      };
      const timer = setTimeout(() => finish(false, new Error(`Timed out loading ${src}`)), timeoutMs);
      script.onload = () => finish(true);
      script.onerror = () => finish(false, new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function installPrimaryAuthGuard() {
    const lib = window.supabase;
    if (!lib?.createClient || lib.__commandCenterPrimaryAuthGuard) return;
    const originalCreateClient = lib.createClient.bind(lib);
    let primaryClientCreated = false;
    lib.createClient = (...args) => {
      const client = originalCreateClient(...args);
      if (primaryClientCreated) return client;
      primaryClientCreated = true;
      const originalOnAuthStateChange = client.auth.onAuthStateChange.bind(client.auth);
      client.auth.onAuthStateChange = callback => {
        let baselineCaptured = false;
        let baselineUserId = null;
        return originalOnAuthStateChange((event, session) => {
          const nextUserId = session?.user?.id || null;
          if (event === 'INITIAL_SESSION') { baselineCaptured = true; baselineUserId = nextUserId; return; }
          if (baselineCaptured && event === 'TOKEN_REFRESHED' && nextUserId === baselineUserId) { baselineUserId = nextUserId; return; }
          if (baselineCaptured && event === 'SIGNED_IN' && nextUserId && nextUserId === baselineUserId) return;
          baselineCaptured = true;
          baselineUserId = nextUserId;
          callback(event, session);
        });
      };
      return client;
    };
    lib.__commandCenterPrimaryAuthGuard = true;
  }

  async function ensureSupabase() {
    if (window.supabase?.createClient) return;
    let lastError = null;
    for (const src of SUPABASE_SOURCES) {
      try {
        await loadScript(src, 5500);
        if (window.supabase?.createClient) return;
        lastError = new Error('Secure library loaded without a usable client.');
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Secure connection library unavailable.');
  }

  async function start(force = false) {
    if (starting) return;
    starting = true;
    revealShell(force ? 'Retrying secure connection…' : 'Starting secure connection…');
    removeRecovery();
    try {
      await ensureSupabase();
      installPrimaryAuthGuard();
      for (const src of CORE_SCRIPTS) await loadScript(src, 7000);
    } catch (error) {
      showRecovery(error?.message || 'Secure startup failed.');
    } finally {
      starting = false;
    }
  }

  revealShell();
  start(false);
})();
