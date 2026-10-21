window.COMMAND_CENTER_CONFIG = {
  supabaseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co",
  supabaseAnonKey: "sb_publishable_LLkZOIOmUX58mcN4HtsUgg_BhTSbiDq",
  refreshMs: 60000,
  excludedProjectNames: ["Operating Order","Crestven Holdings","Crest Van Holdings","Outreach","Crowdskein","Loopwren"]
};

(() => {
  let loaded = false;
  window.COMMAND_CENTER_LOAD_ENHANCEMENTS = () => {
    if (loaded) return;
    loaded = true;
    const addCss=(key,href)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l);};
    const addJs=(key,src)=>{if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';document.body.appendChild(s);};
    addCss('booksHub','./books-hub.css?v=1'); addJs('booksHub','./books-hub.js?v=1');
    addCss('booksRevenue','./books-revenue.css?v=4'); addJs('booksRevenue','./books-revenue.js?v=5');
    addCss('uxPolish','./ux-polish.css?v=1'); addJs('booksPortfolioPolish','./books-portfolio-polish.js?v=1');
    addJs('nextUpLabel','./next-up-label.js?v=1'); addJs('operatingOrderExclusion','./operating-order-exclusion.js?v=3');
    addCss('performanceHub','./performance-hub.css?v=2'); addJs('performanceHub','./performance-hub.js?v=5');
    addCss('refreshOrchestrator','./refresh-orchestrator.css?v=1'); addJs('refreshOrchestrator','./refresh-orchestrator.js?v=7');
    addCss('sourceHealth','./source-health.css?v=1'); addJs('sourceHealth','./source-health.js?v=3');
    addCss('commandCenterV4','./command-center-v4.css?v=1'); addJs('commandCenterV4','./command-center-v4.js?v=1');
    addCss('commandCenterV6','./command-center-v6.css?v=1'); addJs('commandCenterV6','./command-center-v6.js?v=1');
    addCss('commandCenterV62','./command-center-v6-2.css?v=1'); addJs('commandCenterV62','./command-center-v6-2.js?v=1');
    addCss('commandCenterV6Art','./command-center-v6-art.css?v=1');
    addCss('approvedBookCovers','./command-center-book-covers.css?v=2'); addJs('approvedBookCovers','./command-center-book-covers.js?v=2');
    addCss('commandCenterExactMenus','./command-center-exact-menus.css?v=1'); addJs('commandCenterExactMenus','./command-center-exact-menus.js?v=1');
    addCss('commandCenterEarnings','./command-center-earnings.css?v=1'); addJs('commandCenterEarnings','./command-center-earnings.js?v=2');
    addCss('commandCenterBrainHome','./command-center-brain-home.css?v=4'); addCss('commandCenterBrainRoadmaps','./command-center-brain-roadmaps.css?v=1'); addJs('commandCenterBrainHome','./command-center-brain-home.js?v=3');
    addCss('commandCenterBrainWorkspaces','./command-center-brain-workspaces.css?v=1'); addJs('commandCenterBrainMemory','./command-center-brain-memory.js?v=1'); addJs('commandCenterBrainBrainstorm','./command-center-brain-brainstorm.js?v=1');
    addCss('projectRoadmaps','./project-roadmaps.css?v=1'); addJs('projectRoadmaps','./project-roadmaps.js?v=1');
    addJs('appIntegrityRepair','./app-integrity-repair.js?v=1');
  };
})();
