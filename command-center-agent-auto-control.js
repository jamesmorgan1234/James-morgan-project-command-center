(() => {
  if (window.COMMAND_CENTER_AGENT_AUTO_CONTROL) return;

  const client = () => window.COMMAND_CENTER_SUPABASE || null;
  let busy = false;
  let lastValue = null;

  async function authUser() {
    const c = client();
    if (!c) return null;
    const { data: { session }, error } = await c.auth.getSession();
    if (error || !session?.user) return null;
    const gate = await c.rpc('is_command_center_authorized');
    return gate.error || !gate.data ? null : session.user;
  }

  async function getAuto() {
    const c = client(), u = await authUser();
    if (!c || !u) throw new Error('Authorized Command Center session required.');
    const { data, error } = await c.rpc('command_center_agent_service_get_auto', { p_owner_id: u.id });
    if (error) throw error;
    lastValue = data === true;
    return lastValue;
  }

  async function setAuto(enabled) {
    const c = client(), u = await authUser();
    if (!c || !u) throw new Error('Authorized Command Center session required.');
    const { data, error } = await c.rpc('command_center_agent_service_set_auto', {
      p_owner_id: u.id,
      p_enabled: !!enabled,
      p_updated_by: 'command_center_owner_ui'
    });
    if (error) throw error;
    lastValue = !!enabled;
    window.dispatchEvent(new CustomEvent('command-center:agent-auto-changed', { detail: { enabled: lastValue, record: data } }));
    return lastValue;
  }

  function markup(enabled) {
    return `<section class="cc-agent-auto-control" data-agent-auto-control>
      <div class="cc-agent-auto-copy">
        <div class="cc-agent-kicker">Background runner</div>
        <strong>AUTO ${enabled ? 'ON' : 'OFF'}</strong>
        <small>${enabled ? 'Authorized Agent jobs may advance automatically within their existing scope and safety gates.' : 'Background Agent jobs are hard-blocked. Manual Command Center controls still work.'}</small>
      </div>
      <button type="button" class="btn ${enabled ? 'cc-agent-danger' : 'cc-agent-btn-primary'}" data-agent-auto-toggle aria-pressed="${enabled}">${enabled ? 'Turn AUTO off' : 'Turn AUTO on'}</button>
      <div class="cc-agent-status" data-agent-auto-message></div>
    </section>`;
  }

  function style() {
    if (document.getElementById('ccAgentAutoControlStyle')) return;
    const s = document.createElement('style');
    s.id = 'ccAgentAutoControlStyle';
    s.textContent = `.cc-agent-auto-control{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px;margin:0 0 16px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.035)}.cc-agent-auto-copy{display:grid;gap:4px}.cc-agent-auto-copy strong{font-size:1.05rem}.cc-agent-auto-copy small{opacity:.76;line-height:1.35}.cc-agent-auto-control .cc-agent-status{grid-column:1/-1;min-height:0}.cc-agent-auto-control .cc-agent-status:empty{display:none}@media(max-width:640px){.cc-agent-auto-control{grid-template-columns:1fr}.cc-agent-auto-control button{width:100%}}`;
    document.head.appendChild(s);
  }

  async function mount() {
    if (busy) return;
    const hosts = [...document.querySelectorAll('#ccAgentModeMount, #ccAgentProjectPanel')];
    if (!hosts.length) return;
    busy = true;
    try {
      style();
      const enabled = await getAuto();
      for (const host of hosts) {
        let node = host.querySelector(':scope > [data-agent-auto-control]');
        if (!node) {
          node = document.createElement('div');
          node.dataset.agentAutoControl = 'shell';
          host.prepend(node);
        }
        node.innerHTML = markup(enabled);
        const button = node.querySelector('[data-agent-auto-toggle]');
        const msg = node.querySelector('[data-agent-auto-message]');
        button?.addEventListener('click', async () => {
          if (busy) return;
          busy = true;
          button.disabled = true;
          if (msg) msg.textContent = enabled ? 'Turning AUTO off…' : 'Turning AUTO on…';
          try {
            const next = await setAuto(!enabled);
            if (msg) msg.textContent = `AUTO ${next ? 'ON' : 'OFF'} verified.`;
          } catch (error) {
            if (msg) { msg.textContent = error?.message || String(error); msg.classList.add('error'); }
          } finally {
            busy = false;
            setTimeout(mount, 0);
          }
        });
      }
    } catch (error) {
      for (const host of hosts) {
        let node = host.querySelector(':scope > [data-agent-auto-control]');
        if (!node) { node = document.createElement('div'); node.dataset.agentAutoControl = 'shell'; host.prepend(node); }
        node.innerHTML = `<div class="cc-agent-status error">AUTO state unavailable: ${String(error?.message || error).replace(/[&<>"']/g, '')}</div>`;
      }
    } finally { busy = false; }
  }

  const observer = new MutationObserver(() => { if (document.getElementById('ccAgentModeMount') || document.getElementById('ccAgentProjectPanel')) mount(); });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('command-center:advanced-ready', mount);
  window.addEventListener('command-center:brain-capability-open', e => { if (e.detail?.name === 'Agent Mode') setTimeout(mount, 0); });
  window.addEventListener('command-center:agent-auto-changed', () => setTimeout(mount, 0));
  setInterval(() => { if (!document.hidden && (document.getElementById('ccAgentModeMount') || document.getElementById('ccAgentProjectPanel'))) mount(); }, 30000);

  window.COMMAND_CENTER_AGENT_AUTO_CONTROL = { getAuto, setAuto, refresh: mount, destroy: () => observer.disconnect() };
  mount();
})();