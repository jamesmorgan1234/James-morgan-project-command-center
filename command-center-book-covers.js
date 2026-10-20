(() => {
  const ATLAS = './book-cover-atlas-v2.webp?v=2';
  const SLOT_COUNT = 41;
  let scheduled = false;

  const normalize = value => String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const entries = [
    ['Strange Worlds',0],
    ['Dreambeast Atlas',1],
    ['Rooms Beyond Geometry',2],
    ['Fungal Realms',3],
    ['Neon Dreadscapes',4],
    ['Electric Eden',5],
    ['Cities That Dream',6],
    ['Cathedral of Impossible Things',7],
    ['Celestial Oddities',8],
    ['Mechanical Dreams',9],
    ['Daily Progress Planner',10],
    ['A Stronger You',11],
    ['Simple Budgeting Workbook',12],
    ['Take Control of Your Money',13],
    ['Garage Door Business Blueprint',14],
    ['Pieces I Never Got Back',15],
    ['A Calmer Mind',16],
    ['Broken But Still Here',17],
    ['Moving Forward Anyway',18],
    ['The Alpha Mindset',19],
    ['The Map Beneath the Tide',20],
    ['The Kingdom Under Black Water',21],
    ['The Crown of the Drowned',22],
    ['The Unlived Hour',23],
    ['The Dead Between Minutes',24],
    ['The House Outside Time',25],
    ['What the Town Forgot',26],
    ['The Hour That Remains',27],
    ['The Ferris Wheel Between Us',28],
    ['Kiss Me in the Haunted House',29],
    ["The Summer We Don't Leave",30],
    ['The Empire Beneath the Glaze',31],
    ['The Shards Between Kingdoms',32],
    ['The Earth After Firing',33],
    ['Repeat Button',34],
    ['Air Fryer Favorites',35],
    ['Air Fryer Favorites Made Easy',36],
    ['Comfort Food Favorites',37],
    ['Home Cooking Made Simple',38],
    ['Slow Cooker Comforts',39],
    ['Sweet Creations',40]
  ];

  const aliases = new Map();
  for (const [title,index] of entries) {
    aliases.set(normalize(title), index);
    aliases.set(normalize(`Melted Cosmos ${title}`), index);
  }

  function findIndex(title) {
    const key = normalize(title);
    if (aliases.has(key)) return aliases.get(key);
    for (const [known,index] of aliases) {
      if (key === known || key.endsWith(` ${known}`) || known.endsWith(` ${key}`)) return index;
    }
    return null;
  }

  function applyCover(row) {
    const titleEl = row.querySelector('.book-revenue-title');
    const wrap = row.querySelector('.book-revenue-title-wrap');
    if (!titleEl || !wrap) return;
    const index = findIndex(titleEl.textContent);
    if (index === null) return;

    let cover = wrap.querySelector('.cc6-book-cover');
    if (!cover) {
      cover = document.createElement('div');
      cover.className = 'cc6-book-cover';
      cover.dataset.number = String([...row.parentElement.children].indexOf(row) + 1);
      wrap.prepend(cover);
    }

    if (cover.dataset.cc7CoverIndex === String(index)) return;
    const x = SLOT_COUNT === 1 ? 0 : (index / (SLOT_COUNT - 1)) * 100;
    cover.dataset.cc7CoverIndex = String(index);
    cover.classList.add('cc7-approved-cover');
    cover.style.setProperty('--cc7-atlas', `url('${ATLAS}')`);
    cover.style.setProperty('--cc7-x', `${x}%`);
    cover.setAttribute('role','img');
    cover.setAttribute('aria-label',`${titleEl.textContent.trim()} approved cover`);
  }

  function applyAll() {
    document.querySelectorAll('#bookRevenuePanel .book-revenue-row').forEach(applyCover);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyAll();
    });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',() => setTimeout(schedule,0),true);
  window.addEventListener('load',() => { applyAll(); setTimeout(applyAll,250); setTimeout(applyAll,900); },{once:true});
  applyAll();
})();
