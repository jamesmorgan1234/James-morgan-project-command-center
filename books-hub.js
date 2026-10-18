(() => {
  const $ = id => document.getElementById(id);
  let rendering = false;
  let booksOpen = false;
  let bookDetailParent = false;
  let suppressGrouping = false;
  let returnToBooks = false;
  let programmaticReturn = false;
  let bookCards = [];
  let groupedProjectsHtml = '';

  const isBookCard = card => /^kdp-/i.test(String(card?.dataset?.open || ''));
  const projectView = $('projectView');
  const projectGrid = $('projectGrid');

  function isAllProjectsList() {
    return !!projectView && !projectView.hidden &&
      projectView.classList.contains('project-hub-list') &&
      !projectView.classList.contains('attention-hub-list');
  }

  function directProjectCards() {
    if (!projectGrid) return [];
    return [...projectGrid.children].filter(el => el.classList?.contains('hub-project-card') && el.dataset?.open);
  }

  function parseProgress(card) {
    const text = card?.querySelector('.hub-progress-head strong')?.textContent || '';
    const n = Number(String(text).replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  }

  function removeBooksToolbar() {
    $('booksSubhubToolbar')?.remove();
    projectView?.classList.remove('books-subhub-active');
  }

  function groupCardMarkup(count, average) {
    return `<button class="hub-project-card books-group-card tone-purple" data-books-group type="button" aria-label="Open Books">
      <div class="books-group-kicker">BOOK LIBRARY</div>
      <div class="hub-project-head">
        <div class="hub-project-name-wrap">
          <div class="hub-project-name">Books</div>
          <div class="hub-project-stage">All book, series, cookbook, workbook, and coloring projects in one place</div>
        </div>
        <span class="badge planning">${count} book project${count === 1 ? '' : 's'}</span>
      </div>
      <div class="hub-progress-head"><span>Book portfolio progress</span><strong>${average}%</strong></div>
      <div class="hub-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${average}" aria-label="Average current-scope progress across book projects">
        <span class="hub-progress-fill" style="width:${average}%"></span>
      </div>
      <div class="hub-progress-basis">Average of the current-scope progress shown for the book projects inside this group.</div>
      <div class="hub-project-next"><span>Inside</span><strong>Open Books to see every book or series in priority order with its own progress and exact next move.</strong></div>
      <div class="hub-project-open">Open books <span>›</span></div>
    </button>`;
  }

  function captureBooks(cards) {
    const books = cards.filter(isBookCard);
    if (!books.length) return [];
    bookCards = books.map(card => card.outerHTML);
    return books;
  }

  function groupMainProjects() {
    if (rendering || suppressGrouping || !isAllProjectsList() || !projectGrid) return;
    if (projectGrid.querySelector('[data-books-group]')) {
      groupedProjectsHtml = projectGrid.innerHTML;
      if (returnToBooks) {
        returnToBooks = false;
        setTimeout(renderBooksSubhub, 0);
      }
      return;
    }

    const cards = directProjectCards();
    const books = captureBooks(cards);
    if (!books.length) return;

    const values = books.map(parseProgress).filter(v => v !== null);
    const average = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    const firstBook = books[0];

    rendering = true;
    removeBooksToolbar();
    firstBook.insertAdjacentHTML('beforebegin', groupCardMarkup(books.length, average));
    books.forEach(card => card.remove());
    groupedProjectsHtml = projectGrid.innerHTML;
    if ($('viewTitle')) $('viewTitle').textContent = 'All projects';
    rendering = false;

    if (returnToBooks) {
      returnToBooks = false;
      setTimeout(renderBooksSubhub, 0);
    }
  }

  function booksToolbarMarkup() {
    return `<div id="booksSubhubToolbar" class="books-subhub-toolbar">
      <button class="btn btn-ghost books-back-btn" type="button" data-books-back>‹ All projects</button>
      <div class="books-subhub-title-wrap">
        <div class="books-subhub-title">Books</div>
        <div class="books-subhub-subtitle">${bookCards.length} book project${bookCards.length === 1 ? '' : 's'} · highest priority first</div>
      </div>
    </div>`;
  }

  function renderBooksSubhub() {
    if (!projectGrid || !projectView || !bookCards.length) return;
    rendering = true;
    booksOpen = true;
    bookDetailParent = false;
    suppressGrouping = false;
    removeBooksToolbar();
    projectView.classList.add('books-subhub-active');
    const listPanel = projectView.querySelector('.project-list-panel');
    listPanel?.insertAdjacentHTML('afterbegin', booksToolbarMarkup());
    projectGrid.innerHTML = bookCards.join('');
    if ($('viewTitle')) $('viewTitle').textContent = 'Books';
    rendering = false;
    projectView.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function restoreGroupedProjects() {
    if (!projectGrid || !groupedProjectsHtml) return;
    rendering = true;
    booksOpen = false;
    bookDetailParent = false;
    suppressGrouping = false;
    removeBooksToolbar();
    projectGrid.innerHTML = groupedProjectsHtml;
    if ($('viewTitle')) $('viewTitle').textContent = 'All projects';
    rendering = false;
    projectView?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enhanceBookDetailBack() {
    if (!bookDetailParent) return;
    const back = $('detailPanel')?.querySelector('[data-hub-back]');
    if (back && back.textContent.trim() !== '‹ Books') back.textContent = '‹ Books';
  }

  function returnFromBookDetail() {
    bookDetailParent = false;
    booksOpen = false;
    suppressGrouping = false;
    returnToBooks = true;
    removeBooksToolbar();

    const projectsButton = document.querySelector('[data-view="all"]');
    if (!projectsButton) return;
    programmaticReturn = true;
    projectsButton.click();
    programmaticReturn = false;

    setTimeout(() => {
      if (returnToBooks && isAllProjectsList()) groupMainProjects();
    }, 150);
  }

  function resetBooksState({ keepReturn = false } = {}) {
    booksOpen = false;
    bookDetailParent = false;
    suppressGrouping = false;
    if (!keepReturn) returnToBooks = false;
    removeBooksToolbar();
  }

  document.addEventListener('click', e => {
    const group = e.target.closest('[data-books-group]');
    if (group) {
      e.preventDefault();
      e.stopImmediatePropagation();
      renderBooksSubhub();
      return;
    }

    const booksBack = e.target.closest('[data-books-back]');
    if (booksBack) {
      e.preventDefault();
      e.stopImmediatePropagation();
      restoreGroupedProjects();
      return;
    }

    const hubBack = e.target.closest('[data-hub-back]');
    if (hubBack && bookDetailParent) {
      e.preventDefault();
      e.stopImmediatePropagation();
      returnFromBookDetail();
      return;
    }

    const viewButton = e.target.closest('[data-view]');
    if (viewButton) {
      if (viewButton.dataset.view === 'all') resetBooksState({ keepReturn: programmaticReturn });
      else resetBooksState();
      return;
    }

    const bookCard = e.target.closest('#projectGrid .hub-project-card[data-open^="kdp-"]');
    if (booksOpen && bookCard) {
      bookDetailParent = true;
      booksOpen = false;
      suppressGrouping = true;
      removeBooksToolbar();
      setTimeout(enhanceBookDetailBack, 80);
    }
  }, true);

  if (projectView) {
    const observer = new MutationObserver(() => {
      if (rendering) return;

      if (bookDetailParent) {
        if (projectView.classList.contains('project-hub-detail')) {
          suppressGrouping = false;
          enhanceBookDetailBack();
        }
        return;
      }

      if (!isAllProjectsList() || suppressGrouping) return;

      const cards = directProjectCards();
      const hasBooks = cards.some(isBookCard);
      const hasNonBooks = cards.some(card => !isBookCard(card));

      if (booksOpen) {
        if (hasBooks && hasNonBooks) {
          captureBooks(cards);
          setTimeout(renderBooksSubhub, 0);
        }
        return;
      }

      if (hasBooks) groupMainProjects();
    });
    observer.observe(projectView, { childList: true, subtree: true, characterData: true });
  }

  setTimeout(groupMainProjects, 0);
})();
