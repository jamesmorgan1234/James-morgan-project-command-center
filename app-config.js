window.COMMAND_CENTER_CONFIG = {
  supabaseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co",
  supabaseAnonKey: "sb_publishable_LLkZOIOmUX58mcN4HtsUgg_BhTSbiDq",
  refreshMs: 60000,
  excludedProjectNames: ["Operating Order","Crestven Holdings","Crest Van Holdings","Outreach","Crowdskein","Loopwren"]
};

(() => {
  const addCss = (key, href) => {
    if (document.querySelector(`link[data-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[key] = '1';
    document.head.appendChild(link);
  };

  const loadJs = (key, src) => new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-${key}]`);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset[key] = '1';
    script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.body.appendChild(script);
  });

  const css = [
    ['projectHub','./project-hub.css?v=2'],
    ['mobileAccordionPolish','./mobile-accordion-polish.css?v=4'],
    ['booksHub','./books-hub.css?v=1'],
    ['booksRevenue','./books-revenue.css?v=4'],
    ['uxPolish','./ux-polish.css?v=1'],
    ['performanceHub','./performance-hub.css?v=2'],
    ['refreshOrchestrator','./refresh-orchestrator.css?v=1'],
    ['sourceHealth','./source-health.css?v=2'],
    ['commandCenterV4','./command-center-v4.css?v=1'],
    ['commandCenterV6','./command-center-v6.css?v=1'],
    ['commandCenterV62','./command-center-v6-2.css?v=1'],
    ['commandCenterV6Art','./command-center-v6-art.css?v=1'],
    ['approvedBookCovers','./command-center-book-covers.css?v=2'],
    ['commandCenterExactMenus','./command-center-exact-menus.css?v=1'],
    ['commandCenterEarnings','./command-center-earnings.css?v=1'],
    ['commandCenterBrainHome','./command-center-brain-home.css?v=4'],
    ['commandCenterBrainRoadmaps','./command-center-brain-roadmaps.css?v=1'],
    ['commandCenterBrainWorkspaces','./command-center-brain-workspaces.css?v=1'],
    ['commandCenterBrainContext','./command-center-brain-context.css?v=1'],
    ['commandCenterBrainPlanner','./command-center-brain-planner.css?v=1'],
    ['commandCenterBrainHandoff','./command-center-brain-handoff.css?v=1'],
    ['automationAdvanced','./command-center-automation-advanced.css?v=1'],
    ['integrations','./command-center-integrations.css?v=1'],
    ['analytics','./command-center-analytics.css?v=1'],
    ['security','./command-center-security.css?v=1'],
    ['deployment','./command-center-deployment.css?v=1'],
    ['projectRoadmaps','./project-roadmaps.css?v=1'],
    ['commandCenterUiConsistency','./command-center-ui-consistency.css?v=1'],
    ['projectDetailAccordions','./command-center-project-detail-accordions.css?v=1'],
    ['agentMode','./command-center-agent-mode.css?v=1'],
    ['agentDeviceGuidance','./command-center-agent-device-guidance.css?v=1'],
    ['agentHome','./command-center-agent-home.css?v=1'],
    ['bookReviewUi','./command-center-book-review-ui.css?v=2'],
    ['workApprovalUi','./command-center-work-approval-ui.css?v=1'],
    ['agentSixModesV6','./command-center-agent-six-modes-v6.css?v=1']
  ];

  const js = [
    ['booksHub','./books-hub.js?v=1'],
    ['booksRevenue','./books-revenue.js?v=5'],
    ['booksPortfolioPolish','./books-portfolio-polish.js?v=1'],
    ['nextUpLabel','./next-up-label.js?v=1'],
    ['operatingOrderExclusion','./operating-order-exclusion.js?v=3'],
    ['performanceHub','./performance-hub.js?v=5'],
    ['refreshOrchestrator','./refresh-orchestrator.js?v=7'],
    ['sourceHealth','./source-health.js?v=4'],
    ['commandCenterV4','./command-center-v4.js?v=1'],
    ['appIntegrityRepair','./app-integrity-repair.js?v=2'],
    ['commandCenterV6','./command-center-v6.js?v=1'],
    ['commandCenterV62','./command-center-v6-2.js?v=1'],
    ['approvedBookCovers','./command-center-book-covers.js?v=2'],
    ['commandCenterExactMenus','./command-center-exact-menus.js?v=1'],
    ['commandCenterEarnings','./command-center-earnings.js?v=2'],
    ['commandCenterBrainHome','./command-center-brain-home.js?v=5'],
    ['commandCenterBrainMemory','./command-center-brain-memory.js?v=1'],
    ['commandCenterBrainBrainstorm','./command-center-brain-brainstorm.js?v=1'],
    ['commandCenterBrainContext','./command-center-brain-context.js?v=1'],
    ['commandCenterBrainPlanner','./command-center-brain-planner.js?v=1'],
    ['commandCenterBrainHandoff','./command-center-brain-handoff.js?v=1'],
    ['automationAdvanced','./command-center-automation-advanced.js?v=1'],
    ['automationCompletion','./command-center-automation-completion.js?v=1'],
    ['integrations','./command-center-integrations.js?v=1'],
    ['integrationsEmail','./command-center-integrations-email.js?v=1'],
    ['integrationsCompletion','./command-center-integrations-completion.js?v=1'],
    ['analytics','./command-center-analytics.js?v=1'],
    ['analyticsCompletion','./command-center-analytics-completion.js?v=1'],
    ['security','./command-center-security.js?v=1'],
    ['securityAuth','./command-center-security-auth.js?v=1'],
    ['securityCompletion','./command-center-security-completion.js?v=1'],
    ['deployment','./command-center-deployment.js?v=1'],
    ['deploymentCompletion','./command-center-deployment-completion.js?v=1'],
    ['projectRoadmaps','./project-roadmaps.js?v=1'],
    ['roadmapCheckpointRuntime','./roadmap-checkpoint-runtime.js?v=1'],
    ['commandCenterUiConsistency','./command-center-ui-consistency.js?v=1'],
    ['projectDetailAccordions','./command-center-project-detail-accordions.js?v=1'],
    ['agentMode','./command-center-agent-mode.js?v=1'],
    ['agentDeviceGuidance','./command-center-agent-device-guidance.js?v=1'],
    ['agentRunnerStatus','./command-center-agent-runner-status.js?v=1'],
    ['agentAutoControl','./command-center-agent-auto-control.js?v=1'],
    ['agentHome','./command-center-agent-home.js?v=1'],
    ['agentModeCompletion','./command-center-agent-mode-completion.js?v=4'],
    ['bookReviewGuard','./command-center-book-review-guard.js?v=1'],
    ['bookReviewUiV5','./command-center-book-review-ui-v5.js?v=1'],
    ['workBoundaryMode','./command-center-work-boundary-mode.js?v=1'],
    ['workApprovalUiV3','./command-center-work-approval-ui-v3.js?v=1'],
    ['agentSixModesV6','./command-center-agent-six-modes-v6.js?v=1']
  ];

  let enhancementPromise = null;
  window.COMMAND_CENTER_LOAD_ENHANCEMENTS = () => {
    if (enhancementPromise) return enhancementPromise;
    css.forEach(([key,href]) => addCss(key,href));
    enhancementPromise = (async () => {
      for (const [key,src] of js) await loadJs(key,src);
      window.COMMAND_CENTER_FULL_INTERFACE_READY = true;
      window.dispatchEvent(new CustomEvent('command-center:full-interface-ready'));
      return true;
    })().catch(error => {
      enhancementPromise = null;
      throw error;
    });
    return enhancementPromise;
  };

  window.COMMAND_CENTER_LOAD_ADVANCED = () => window.COMMAND_CENTER_LOAD_ENHANCEMENTS();
})();