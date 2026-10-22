const root=document.getElementById('fixture');
const screen=new URLSearchParams(location.search).get('screen')||'projects';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
const icon=name=>`<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({book:'<path d="M7 10h12c4 0 6 2 6 6v23c0-4-2-6-6-6H7z"/><path d="M41 10H29c-4 0-6 2-6 6v23c0-4 2-6 6-6h12z"/>',brain:'<path d="M19 9c-5-3-10 1-9 6-5 1-6 8-2 11-3 5 1 11 7 10 1 5 8 5 10 1V14c0-5-3-7-6-5Z"/><path d="M29 9c5-3 10 1 9 6 5 1 6 8 2 11 3 5-1 11-7 10-1 5-8 5-10 1V14c0-5 3-7 6-5Z"/>',chart:'<path d="M9 38V27h7v11M21 38V19h7v19M33 38V10h7v28"/>',doc:'<path d="M12 6h17l8 8v28H12z"/><path d="M29 6v9h8M18 23h13M18 30h13"/>',people:'<circle cx="18" cy="17" r="6"/><circle cx="33" cy="19" r="5"/><path d="M7 39c1-8 6-12 12-12s11 4 12 12M29 29c7-1 12 3 13 10"/>',gear:'<circle cx="24" cy="24" r="7"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.5 4.5M33 33l4.5 4.5M37.5 10.5 33 15M15 33l-4.5 4.5"/>',box:'<path d="m24 5 16 8-16 8-16-8 16-8Z"/><path d="m8 13 16 8 16-8v20l-16 8-16-8V13Z"/>',code:'<path d="m17 13-10 11 10 11M31 13l10 11-10 11M27 8 21 40"/>',folder:'<path d="M5 13h14l4 5h20l-5 22H9z"/>'})[name]||''}</svg>`;
const frame=name=>`<div class="cc-icon-frame"><div class="cc-icon">${icon(name)}</div></div>`;
const status=(label,cls='')=>`<span class="cc-status ${cls}">${label}</span>`;
const art=i=>['planet','neural','bars','road','network'][i%5];
const head=(title,sub)=>`<header class="cc-header"><button class="cc-back" type="button"><span>‹</span></button><div class="cc-title-wrap"><h1 class="cc-title">${title}</h1><p class="cc-subtitle">${sub}</p></div></header><div class="cc-rule"></div>`;

// Approved Projects screenshot fixture. These values are visual-reference data only.
const projects=[
 ['The Missing Hour Saga','5-book time travel series','In Progress','',60,'3 / 5 books','book'],
 ['AI Systems Upgrade','Platform and tooling rebuild','Planning','planning',25,'2 / 8 phases','brain'],
 ['Creator Analytics 2.0','Enhanced analytics dashboard','In Progress','',70,'7 / 10 modules','chart'],
 ['Content Pipeline','Automated content workflow','Live','live',90,'9 / 10 tasks','doc'],
 ['Community Hub','Community features and tools','Queued','queued',15,'1 / 7 features','people'],
 ['Website Redesign','New site experience','Planning','planning',30,'3 / 10 tasks','gear'],
 ['Data Infrastructure','Core systems and data layer','Active Rebuild','active-rebuild',45,'5 / 11 components','box'],
 ['Marketing Revamp','Brand and audience growth','Blocked','blocked',20,'2 / 10 tasks','chart']
];
function projectRow(p,i){return`<div class="cc-card cc-project-row">${frame(p[6])}<div class="cc-copy"><h2 class="cc-name">${esc(p[0])}</h2><p class="cc-desc">${esc(p[1])}</p>${status(p[2],p[3])}</div><div><div class="cc-progress" style="--p:${p[4]};--ring:${p[4]>=90?'#00e989':p[3]==='blocked'?'#ff3545':'#ffb21b'}"><strong>${p[4]}%</strong></div><div class="cc-progress-meta">${p[5]}</div></div><div class="cc-chevron">›</div><div class="cc-art ${art(i)}"></div></div>`;}
function projectsPage(){return`<section class="cc-screen">${head('Projects','Full portfolio of tracked projects')}<div class="cc-stack"><div class="cc-card cc-summary">${frame('folder')}<div class="cc-summary-count">18</div><div class="cc-divider"></div><div class="cc-summary-copy"><strong>TOTAL PROJECTS</strong><span>8 live • 6 in progress • 4 planning</span></div><div class="cc-chevron">›</div><div class="cc-art planet"></div></div>${projects.map(projectRow).join('')}</div></section>`;}

// Approved Next Up screenshot fixture. Status is intentionally independent from Projects.
const nextItems=[
 ['The Missing Hour Saga','In Progress','','book','Write and develop the next chapter.'],
 ['AI Systems Upgrade','Planning','planning','brain','Design next phase of AI tooling.'],
 ['Creator Analytics 2.0','In Progress','','chart','Build enhanced analytics dashboard.'],
 ['Content Pipeline','Ready','ready','doc','Prepare next month’s content batch.'],
 ['Community Hub','Queued','queued','people','Plan community features and roadmap.'],
 ['Website Redesign','Queued','queued','gear','Design new site experience.'],
 ['Merch Store Launch','Queued','queued','box','Finalize products and launch plan.']
];
function nextRow(p,i){return`<div class="cc-card cc-next-row">${frame(p[3])}<div class="cc-copy"><h2 class="cc-name">${esc(p[0])}</h2>${status(p[1],p[2])}<p class="cc-desc" style="margin-top:6px">${esc(p[4])}</p></div><div class="cc-chevron">›</div><div class="cc-art ${art(i)}"></div></div>`;}
function nextPage(){return`<section class="cc-screen">${head('Next Up','Priority queue')}<div class="cc-stack">${nextItems.map(nextRow).join('')}</div></section>`;}

// Approved Active / Live screenshot fixture. Values are intentionally screen-specific.
const liveItems=[
 ['The Missing Hour Saga','In Progress','',68,'Synced 2h ago','book','Write and develop the next chapter.'],
 ['AI Systems Upgrade','Planning','planning',42,'Synced 4h ago','brain','Design next phase of AI tooling.'],
 ['Creator Analytics 2.0','In Progress','',75,'12 Active','chart','Build enhanced analytics dashboard.'],
 ['Content Pipeline','Live','live',90,'8 Active','doc','Prepare next month’s content batch.'],
 ['Community Hub','Live','live',60,'5 Active','people','Grow and engage the community.'],
 ['Website Redesign','Planning','planning',35,'Synced 6h ago','gear','Design new site experience.'],
 ['Mobile App v2','In Progress','',55,'6 Active','code','Build and test new features.']
];
function liveRow(p,i){return`<div class="cc-card cc-live-row">${frame(p[5])}<div class="cc-copy"><h2 class="cc-name">${esc(p[0])}</h2>${status(p[1],p[2])}<p class="cc-desc" style="margin-top:6px">${esc(p[6])}</p></div><div class="cc-scope"><strong>${p[3]}%</strong><span>Scope</span><div class="cc-live-secondary">${esc(p[4])}</div></div><div class="cc-chevron">›</div><div class="cc-art ${art(i)}"></div></div>`;}
function livePage(){return`<section class="cc-screen">${head('Active / Live','Live projects in progress')}<div class="cc-stack">${liveItems.map(liveRow).join('')}</div></section>`;}

function pub(label,count){return`<div class="cc-pub"><div>${label}</div><b>${count}</b><span style="color:#00e989">Published</span></div>`;}
function detailPage(){const performance=[['$','$4,231.56','Verified revenue'],['▥','$2,987.14','Royalties'],['♛','$1,124.32','KDP Select royalties'],['□','1,842','Book sales'],['▤','312,658','Pages read'],['≡','5','Current scope']];const books=['The Missing Hour','The Echo Reckoning','The Fractured Tomorrow','The Last Convergence','The Infinite Return'];return`<section class="cc-screen">${head('The Missing Hour Saga','Project Details')}<div class="cc-stack"><div class="cc-card cc-hero"><div class="cc-hero-cover"></div><div class="cc-hero-copy"><div class="cc-hero-kicker">SCIENCE FICTION SERIES</div><h2>The Missing Hour Saga</h2><p>A 5-book time travel thriller series following ordinary people caught in an extraordinary fight for tomorrow.</p><div class="cc-meta">Created Jan 12, 2024 • 5 books • KDP</div></div><div class="cc-hero-side">${status('Active','live')}<div class="cc-chevron">›</div></div><div class="cc-art planet"></div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${icon('chart')}</div>KDP PERFORMANCE</div><span class="cc-section-note">All time (to date)</span></div><div class="cc-metrics">${performance.map(([i,v,l])=>`<div class="cc-metric"><div class="cc-mini-icon">${i}</div><div><strong>${v}</strong><span>${l}</span></div></div>`).join('')}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${icon('book')}</div>BOOKS IN SERIES</div><span class="cc-section-note">5 books</span></div><div class="cc-covers">${books.map((b,i)=>`<div class="cc-book"><div class="cc-cover"><span class="cc-book-num">${i+1}</span></div><div class="cc-book-name">${b}</div></div>`).join('')}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${icon('doc')}</div>PUBLICATION STATUS</div></div><div class="cc-pub-grid">${pub('Kindle eBook','5 / 5')}${pub('KDP Select','5 / 5')}${pub('Paperback','5 / 5')}${pub('Hardcover','5 / 5')}</div></div><div class="cc-card cc-row-link"><div class="cc-mini-icon">${icon('chart')}</div><div><h3>KDP SNAPSHOT HISTORY</h3><p>Track revenue, royalties, sales and pages read over time.</p></div><div class="cc-chevron">›</div></div><div class="cc-card cc-row-link"><div class="cc-mini-icon">${icon('gear')}</div><div><h3>TRACKING INTEGRATIONS</h3><p>KDP, Amazon Ads, and Sales Tracking</p></div><div class="cc-chevron">›</div></div></div></section>`;}
root.innerHTML=screen==='next'?nextPage():screen==='active'?livePage():screen==='detail'?detailPage():projectsPage();
