(() => {
  if (window.COMMAND_CENTER_APPROVED_NAV) return;
  window.COMMAND_CENTER_APPROVED_NAV = { version: 1 };

  document.addEventListener('click', event => {
    const back = event.target.closest('#ccApprovedApp [data-cc-back]');
    if (!back) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (history.state?.ccApproved) {
      history.back();
      return;
    }
    const projects = document.querySelector('#ccApprovedApp [data-cc-home="projects"]');
    if (projects) projects.click();
  }, true);
})();