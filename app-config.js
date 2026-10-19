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
        if (baselineCaptured && event === 'SIGNED_IN' && nextUserId && nextUserId === baselineUserId) return;
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
  excludedProjectNames: ["Operating Order","Crestven Holdings","Crest Van Holdings","Outreach","Crowdskein","Loopwren"]
};

window.addEventListener('load', () => {
  const addStyle=(sel,href,key)=>{if(!document.querySelector(sel)){const el=document.createElement('link');el.rel='stylesheet';el.href=href;el.dataset[key]='1';document.head.appendChild(el);}};
  const addScript=(sel,src,key)=>{if(!document.querySelector(sel)){const el=document.createElement('script');el.src=src;el.dataset[key]='1';document.body.appendChild(el);}};
  addStyle('link[data-books-hub]','./books-hub.css?v=1','booksHub');
  addScript('script[data-books-hub]','./books-hub.js?v=1','booksHub');
  addStyle('link[data-books-revenue]','./books-revenue.css?v=4','booksRevenue');
  addScript('script[data-books-revenue]','./books-revenue.js?v=5','booksRevenue');
  addStyle('link[data-ux-polish]','./ux-polish.css?v=1','uxPolish');
  addScript('script[data-books-portfolio-polish]','./books-portfolio-polish.js?v=1','booksPortfolioPolish');
  addScript('script[data-next-up-label]','./next-up-label.js?v=1','nextUpLabel');
  addScript('script[data-operating-order-exclusion]','./operating-order-exclusion.js?v=2','operatingOrderExclusion');
  addStyle('link[data-performance-hub]','./performance-hub.css?v=2','performanceHub');
  addScript('script[data-performance-hub]','./performance-hub.js?v=5','performanceHub');
  addStyle('link[data-refresh-orchestrator]','./refresh-orchestrator.css?v=1','refreshOrchestrator');
  addScript('script[data-refresh-orchestrator]','./refresh-orchestrator.js?v=4','refreshOrchestrator');
  addStyle('link[data-source-health]','./source-health.css?v=1','sourceHealth');
  addScript('script[data-source-health]','./source-health.js?v=2','sourceHealth');
}, { once: true });
