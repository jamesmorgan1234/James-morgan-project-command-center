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
    addCss('sourceHealth','./source-health.css?v=2'); addJs('sourceHealth','./source-health.js?v=4');
    addCss('commandCenterV4','./command-center-v4.css?v=1'); addJs('commandCenterV4','./command-center-v4.js?v=1');
    addJs('appIntegrityRepair','./app-integrity-repair.js?v=2');
    addCss('commandCenterV6','./command-center-v6.css?v=1'); addJs('commandCenterV6','./command-center-v6.js?v=1');
    addCss('commandCenterV62','./command-center-v6-2.css?v=1'); addJs('commandCenterV62','./command-center-v6-2.js?v=1');
    addCss('commandCenterV6Art','./command-center-v6-art.css?v=1');
    addCss('approvedBookCovers','./command-center-book-covers.css?v=2'); addJs('approvedBookCovers','./command-center-book-covers.js?v=2');
    addCss('commandCenterExactMenus','./command-center-exact-menus.css?v=1'); addJs('commandCenterExactMenus','./command-center-exact-menus.js?v=1');
    addCss('commandCenterEarnings','./command-center-earnings.css?v=1'); addJs('commandCenterEarnings','./command-center-earnings.js?v=2');
    addCss('commandCenterBrainHome','./command-center-brain-home.css?v=4'); addCss('commandCenterBrainRoadmaps','./command-center-brain-roadmaps.css?v=1'); addJs('commandCenterBrainHome','./command-center-brain-home.js?v=5');
    addCss('commandCenterBrainWorkspaces','./command-center-brain-workspaces.css?v=1'); addJs('commandCenterBrainMemory','./command-center-brain-memory.js?v=1'); addJs('commandCenterBrainBrainstorm','./command-center-brain-brainstorm.js?v=1'); addCss('commandCenterBrainContext','./command-center-brain-context.css?v=1'); addJs('commandCenterBrainContext','./command-center-brain-context.js?v=1'); addCss('commandCenterBrainPlanner','./command-center-brain-planner.css?v=1'); addJs('commandCenterBrainPlanner','./command-center-brain-planner.js?v=1'); addCss('commandCenterBrainHandoff','./command-center-brain-handoff.css?v=1'); addJs('commandCenterBrainHandoff','./command-center-brain-handoff.js?v=1');
    addCss('automationAdvanced','./command-center-automation-advanced.css?v=1'); addJs('automationAdvanced','./command-center-automation-advanced.js?v=1'); addJs('automationCompletion','./command-center-automation-completion.js?v=1');
    addCss('integrations','./command-center-integrations.css?v=1'); addJs('integrations','./command-center-integrations.js?v=1'); addJs('integrationsEmail','./command-center-integrations-email.js?v=1'); addJs('integrationsCompletion','./command-center-integrations-completion.js?v=1');
    addCss('analytics','./command-center-analytics.css?v=1'); addJs('analytics','./command-center-analytics.js?v=1'); addJs('analyticsCompletion','./command-center-analytics-completion.js?v=1');
    addCss('security','./command-center-security.css?v=1'); addJs('security','./command-center-security.js?v=1'); addJs('securityAuth','./command-center-security-auth.js?v=1'); addJs('securityCompletion','./command-center-security-completion.js?v=1');
    addCss('deployment','./command-center-deployment.css?v=1'); addJs('deployment','./command-center-deployment.js?v=1'); addJs('deploymentCompletion','./command-center-deployment-completion.js?v=1');
    addCss('projectRoadmaps','./project-roadmaps.css?v=1'); addJs('projectRoadmaps','./project-roadmaps.js?v=1'); addJs('roadmapCheckpointRuntime','./roadmap-checkpoint-runtime.js?v=1');
    addCss('commandCenterUiConsistency','./command-center-ui-consistency.css?v=1'); addJs('commandCenterUiConsistency','./command-center-ui-consistency.js?v=1');
    addCss('projectDetailAccordions','./command-center-project-detail-accordions.css?v=1'); addJs('projectDetailAccordions','./command-center-project-detail-accordions.js?v=1');
    addCss('agentMode','./command-center-agent-mode.css?v=1'); addJs('agentMode','./command-center-agent-mode.js?v=1');
    addCss('agentDeviceGuidance','./command-center-agent-device-guidance.css?v=1'); addJs('agentDeviceGuidance','./command-center-agent-device-guidance.js?v=1');
    addJs('agentRunnerStatus','./command-center-agent-runner-status.js?v=1');
    addCss('agentHome','./command-center-agent-home.css?v=1'); addJs('agentHome','./command-center-agent-home.js?v=1');
    addJs('bookReviewGuard','./command-center-book-review-guard.js?v=1');
    addCss('bookReviewUi','./command-center-book-review-ui.css?v=2'); addJs('bookReviewUi','./command-center-book-review-ui.js?v=3');
    addCss('workApprovalUi','./command-center-work-approval-ui.css?v=1'); addJs('workApprovalUi','./command-center-work-approval-ui.js?v=1');
    addJs('agentModeCompletion','./command-center-agent-mode-completion.js?v=2');
  };
})();