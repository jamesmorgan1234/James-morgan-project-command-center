(() => {
  if (window.__COMMAND_CENTER_APPROVED_MOUNT_GUARD) return;
  window.__COMMAND_CENTER_APPROVED_MOUNT_GUARD = true;

  let timer = null;
  let attempts = 0;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));

  function ensureRoot() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard || dashboard.hidden) return null;
    let root = document.getElementById('ccApprovedApp');
    if (!root) {
      root = document.createElement('section');
      root.id = 'ccApprovedApp';
      root.className = 'cc-approved-app';
      dashboard.appendChild(root);
    }
    return root;
  }

  function showLoading(root) {
    if (!root || root.childElementCount) return;
    root.innerHTML = '<section class="cc-approved-section" data-cc-mount-state="loading"><div class="cc-approved-section-title"><strong>COMMAND CENTER</strong><span>Loading</span></div><div class="cc-approved-empty">Loading your verified projects…</div></section>';
  }

  function showError(root, error) {
    if (!root) return;
    const message = esc(error?.message || 'The Command Center data view did not finish loading.');
    root.innerHTML = `<section class="cc-approved-section" data-cc-mount-state="error"><div class="cc-approved-section-title"><strong>COMMAND CENTER</strong><span>Needs refresh</span></div><div class="cc-approved-empty">${message}</div><button type="button" class="cc-approved-inline-action" data-cc-mount-retry>Retry loading Command Center</button></section>`;
    root.querySelector('[data-cc-mount-retry]')?.addEventListener('click', () => kick(true));
  }

  async function kick(force = false) {
    const root = ensureRoot();
    if (!root) return false;
    const realContent = root.querySelector('.cc-approved-home-grid,.cc-approved-project-list,.cc-approved-project-hero,.cc-approved-agent-home,.cc-approved-revenue-hero');
    if (realContent && !force) return true;

    showLoading(root);
    const refresh = window.COMMAND_CENTER_APPROVED_UI?.refresh;
    if (typeof refresh !== 'function') return false;

    try {
      await refresh();
      const mounted = Boolean(root.querySelector('.cc-approved-home-grid,.cc-approved-project-list,.cc-approved-project-hero,.cc-approved-agent-home,.cc-approved-revenue-hero'));
      if (!mounted && force) throw new Error('The approved Command Center renderer returned without mounting a screen.');
      return mounted;
    } catch (error) {
      showError(root, error);
      return false;
    }
  }

  function startGuard() {
    if (timer) clearInterval(timer);
    attempts = 0;
    timer = setInterval(async () => {
      attempts += 1;
      const mounted = await kick(false);
      if (mounted || attempts >= 40) {
        clearInterval(timer);
        timer = null;
        if (!mounted) {
          const root = ensureRoot();
          if (root && !root.querySelector('[data-cc-mount-state="error"]')) {
            showError(root, new Error('The approved Command Center screen did not mount.'));
          }
        }
      }
    }, 250);
  }

  window.addEventListener('command-center:client-ready', startGuard);
  window.addEventListener('focus', () => kick(false));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kick(false);
  });

  startGuard();
})();