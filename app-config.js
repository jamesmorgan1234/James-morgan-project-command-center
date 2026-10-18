window.COMMAND_CENTER_CONFIG = {
  supabaseUrl: "https://gmlsucpwliegwlxymjvp.supabase.co",
  supabaseAnonKey: "sb_publishable_LLkZOIOmUX58mcN4HtsUgg_BhTSbiDq",
  refreshMs: 60000,
  excludedProjectNames: ["Operating Order"]
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
  if (!document.querySelector('script[data-next-up-label]')) {
    const script = document.createElement('script');
    script.src = './next-up-label.js?v=1';
    script.dataset.nextUpLabel = '1';
    document.body.appendChild(script);
  }
  if (!document.querySelector('script[data-operating-order-exclusion]')) {
    const script = document.createElement('script');
    script.src = './operating-order-exclusion.js?v=1';
    script.dataset.operatingOrderExclusion = '1';
    document.body.appendChild(script);
  }
}, { once: true });
