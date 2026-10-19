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
    link.href = './books-revenue.css?v=3';
    link.dataset.booksRevenue = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-books-revenue]')) {
    const script = document.createElement('script');
    script.src = './books-revenue.js?v=4';
    script.dataset.booksRevenue = '1';
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
    script.src = './performance-hub.js?v=3';
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
    script.src = './refresh-orchestrator.js?v=3';
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
    script.src = './source-health.js?v=1';
    script.dataset.sourceHealth = '1';
    document.body.appendChild(script);
  }
}, { once: true });
