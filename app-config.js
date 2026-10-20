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
        if (event === 'INITIAL_SESSION') { baselineCaptured = true; baselineUserId = nextUserId; return; }
        if (baselineCaptured && event === 'TOKEN_REFRESHED' && nextUserId === baselineUserId) { baselineUserId = nextUserId; return; }
        if (baselineCaptured && event === 'SIGNED_IN' && nextUserId && nextUserId === baselineUserId) return;
        baselineCaptured = true; baselineUserId = nextUserId; callback(event, session);
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
  const addCss=(key,href)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);};
  const addJs=(key,src)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.dataset[key]='1';document.body.appendChild(s);};
  addCss('booksHub','./books-hub.css?v=1'); addJs('booksHub','./books-hub.js?v=1');
  addCss('booksRevenue','./books-revenue.css?v=4'); addJs('booksRevenue','./books-revenue.js?v=5');
  addCss('uxPolish','./ux-polish.css?v=1'); addJs('booksPortfolioPolish','./books-portfolio-polish.js?v=1');
  addJs('nextUpLabel','./next-up-label.js?v=1'); addJs('operatingOrderExclusion','./operating-order-exclusion.js?v=2');
  addCss('performanceHub','./performance-hub.css?v=2'); addJs('performanceHub','./performance-hub.js?v=5');
  addCss('refreshOrchestrator','./refresh-orchestrator.css?v=1'); addJs('refreshOrchestrator','./refresh-orchestrator.js?v=6');
  addCss('sourceHealth','./source-health.css?v=1'); addJs('sourceHealth','./source-health.js?v=2');
  addCss('commandCenterV4','./command-center-v4.css?v=1'); addJs('commandCenterV4','./command-center-v4.js?v=1');
  addCss('commandCenterV6','./command-center-v6.css?v=1'); addJs('commandCenterV6','./command-center-v6.js?v=1');
  addCss('commandCenterV62','./command-center-v6-2.css?v=1');
  addCss('commandCenterV6Art','./command-center-v6-art.css?v=1');
  addCss('commandCenterV7','./command-center-v7.css?v=1'); addJs('commandCenterV7','./command-center-v7.js?v=1');
}, { once: true });
