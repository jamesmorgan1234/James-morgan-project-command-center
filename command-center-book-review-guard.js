(() => {
  if (window.COMMAND_CENTER_BOOK_REVIEW_GUARD) return;
  window.COMMAND_CENTER_BOOK_REVIEW_GUARD = { version: 1 };
  const REVIEW_RULE = ' BOOKS OWNER REVIEW GATE: Creating or preparing a final PDF, print interior, cover, EPUB, or KDP package is not owner approval. Before any publishing/upload/submission step, stop at a user-only PC REQUIRED review checkpoint. Present the exact final PDF/package for James Morgan to inspect on his computer. Do not mark the book approved and do not proceed into publishing until James explicitly chooses Approve after inspection. If he chooses Needs Changes or reports a problem, return the project to correction work and regenerate/reverify the affected final files. Ordinary completion of file generation must never satisfy this review gate.';

  function install() {
    const c = window.COMMAND_CENTER_SUPABASE;
    if (!c?.rpc) return false;
    if (c.__ccBookReviewGuardInstalled) return true;
    const original = c.rpc.bind(c);
    c.rpc = (name, args, options) => {
      if (name === 'command_center_agent_create_project_only_session' && args?.p_books_target) {
        const objective = String(args.p_objective || '');
        if (!objective.includes('BOOKS OWNER REVIEW GATE:')) args = { ...args, p_objective: `${objective}${REVIEW_RULE}` };
      }
      return original(name, args, options);
    };
    c.__ccBookReviewGuardInstalled = true;
    return true;
  }

  let attempts = 0;
  function retry() {
    if (install() || attempts++ > 80) return;
    setTimeout(retry, 100);
  }
  window.addEventListener('command-center:client-ready', install);
  retry();
})();
