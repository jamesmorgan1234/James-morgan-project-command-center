(() => {
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
        if (event === 'INITIAL_SESSION') {
          baselineCaptured = true;
          baselineUserId = nextUserId;
          return;
        }
        if (baselineCaptured && event === 'TOKEN_REFRESHED' && nextUserId === baselineUserId) {
          baselineUserId = nextUserId;
          return;
        }
        if (baselineCaptured && event === 'SIGNED_IN' && nextUserId && nextUserId === baselineUserId) {
          return;
        }
        baselineCaptured = true;
        baselineUserId = nextUserId;
        callback(event, session);
      });
    };
    return client;
  };
  lib.__commandCenterPrimaryAuthGuard = true;
})();

window.COMMAND_CENTER_CONFIG = {
  supabaseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co",
  supabaseAnonKey: "sb_publishable_LLkZOIOmUX58mcN4HtsUgg_BhTSbiDq",
  refreshMs: 60000,
  excludedProjectNames: [
    "Operating Order",
    "Crestven Holdings",
    "Crest Van Holdings",
    "Outreach",
    "Crowdskein",
    "Loopwren"
  ]
};

window.addEventListener('load', () => {
  if (!document.querySelector('link[data-books-hub]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './books-hub.css?v=1';
    link.dataset.booksHub = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-books-hub]')) {
    const script = document.createElement('script');
    script.src = './books-hub.js?v=1';
    script.dataset.booksHub = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('link[data-books-revenue]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './books-revenue.css?v=4';
    link.dataset.booksRevenue = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-books-revenue]')) {
    const script = document.createElement('script');
    script.src = './books-revenue.js?v=5';
    script.dataset.booksRevenue = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('link[data-ux-polish]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './ux-polish.css?v=1';
    link.dataset.uxPolish = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-books-portfolio-polish]')) {
    const script = document.createElement('script');
    script.src = './books-portfolio-polish.js?v=1';
    script.dataset.booksPortfolioPolish = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('script[data-next-up-label]')) {
    const script = document.createElement('script');
    script.src = './next-up-label.js?v=1';
    script.dataset.nextUpLabel = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('script[data-operating-order-exclusion]')) {
    const script = document.createElement('script');
    script.src = './operating-order-exclusion.js?v=2';
    script.dataset.operatingOrderExclusion = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('link[data-performance-hub]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './performance-hub.css?v=2';
    link.dataset.performanceHub = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-performance-hub]')) {
    const script = document.createElement('script');
    script.src = './performance-hub.js?v=5';
    script.dataset.performanceHub = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('link[data-refresh-orchestrator]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './refresh-orchestrator.css?v=1';
    link.dataset.refreshOrchestrator = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-refresh-orchestrator]')) {
    const script = document.createElement('script');
    script.src = './refresh-orchestrator.js?v=4';
    script.dataset.refreshOrchestrator = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('link[data-source-health]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './source-health.css?v=1';
    link.dataset.sourceHealth = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-source-health]')) {
    const script = document.createElement('script');
    script.src = './source-health.js?v=2';
    script.dataset.sourceHealth = '1';
    document.body.appendChild(script);
  }
}, { once: true });
