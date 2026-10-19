(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  let client = null;
  let cache = { projects: [], metrics: [] };
  let loading = null;
  let timer = null;
  let mutating = false;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm = v => String(v || '').trim().toLowerCase();
  const money = n => new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n || 0));

  async function getClient(){
    if(client) return client;
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  async function load(force=false){
    if(!force && cache.projects.length) return cache;
    if(loading) return loading;
    loading=(async()=>{
      const c=await getClient();
      if(!c) return cache;
      const {data:{session}}=await c.auth.getSession();
      if(!session) return cache;
      const [p,m]=await Promise.all([
        c.from('projects').select('id,name,status,stage'),
        c.from('metrics').select('project_id,key,label,value_numeric,value_text,unit,verified,source,updated_at').order('updated_at',{ascending:false})
      ]);
      if(!p.error && !m.error) cache={projects:p.data||[],metrics:m.data||[]};
      return cache;
    })().finally(()=>{loading=null;});
    return loading;
  }

  const projectMetrics = id => cache.metrics.filter(m=>m.project_id===id);
  const first = (ms,keys) => { for(const key of keys){ const m=ms.find(x=>x.key===key); if(m) return m; } return null; };
  const verifiedNumber = m => m && m.verified===true && m.value_numeric!==null && m.value_numeric!==undefined && Number.isFinite(Number(m.value_numeric));
  const value = m => verifiedNumber(m) ? Number(m.value_numeric) : null;

  function bookGroups(ms){
    const groups=new Map();
    for(const m of ms){
      const match=String(m.key||'').match(/^book[.:_]([^.:_]+)[.:_](.+)$/i);
      if(!match) continue;
      const slug=match[1], key=match[2];
      if(!groups.has(slug)) groups.set(slug,[]);
      groups.get(slug).push({...m,_key:key});
    }
    return [...groups.entries()].map(([slug,items])=>{
      const find = rx => items.find(x=>rx.test(x._key));
      const title=find(/^(title|name|display_name)$/i);
      const kdp=find(/^(kdp_royalties_usd|kdp_revenue_usd|royalties_usd|kdp_royalties)$/i);
      const select=find(/^(kdp_select_earnings_usd|kdp_select_usd|ku_earnings_usd|kindle_unlimited_earnings_usd|select_earnings_usd)$/i);
      const explicitTotal=find(/^(verified_lifetime_revenue_usd|lifetime_revenue_usd|total_revenue_usd|revenue_usd)$/i);
      const kv=value(kdp), sv=value(select), tv=value(explicitTotal);
      const components=[kv,sv].filter(v=>v!==null);
      const total=tv!==null?tv:(components.length?components.reduce((a,b)=>a+b,0):null);
      return {
        slug,
        title:title?.value_text || slug.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
        kdp:kv,
        select:sv,
        total,
        hasVerified:tv!==null || components.length>0
      };
    });
  }

  function projectRevenue(id){
    const ms=projectMetrics(id);
    const books=bookGroups(ms);
    const booksWithRevenue=books.filter(b=>b.hasVerified);
    if(booksWithRevenue.length){
      return {
        total:booksWithRevenue.reduce((s,b)=>s+(b.total||0),0),
        kdp:booksWithRevenue.some(b=>b.kdp!==null)?booksWithRevenue.reduce((s,b)=>s+(b.kdp||0),0):null,
        select:booksWithRevenue.some(b=>b.select!==null)?booksWithRevenue.reduce((s,b)=>s+(b.select||0),0):null,
        books,
        source:'book'
      };
    }
    const kdp=first(ms,['kdp_royalties_usd','kdp_revenue_usd']);
    const select=first(ms,['kdp_select_earnings_usd','ku_earnings_usd','kindle_unlimited_earnings_usd']);
    const total=first(ms,['verified_lifetime_revenue_usd','lifetime_revenue_usd','kdp_total_revenue_usd']);
    const kv=value(kdp), sv=value(select), tv=value(total);
    const components=[kv,sv].filter(v=>v!==null);
    return {
      total:tv!==null?tv:(components.length?components.reduce((a,b)=>a+b,0):null),
      kdp:kv,
      select:sv,
      books,
      source:tv!==null||components.length?'project':null
    };
  }

  function portfolioRevenue(){
    const projects=cache.projects.filter(p=>/^kdp-/i.test(p.id));
    let total=0, recordedProjects=0, bookRows=0;
    for(const p of projects){
      const r=projectRevenue(p.id);
      if(r.total!==null){ total+=r.total; recordedProjects+=1; }
      bookRows+=r.books.filter(b=>b.hasVerified).length;
    }
    return {total:recordedProjects?total:null,recordedProjects,totalProjects:projects.length,bookRows};
  }

  function decorateGroup(){
    const card=document.querySelector('[data-books-group]');
    if(!card) return;
    card.querySelector('[data-books-revenue-ui]')?.remove();
    const p=portfolioRevenue();
    const text=p.total===null?'Not recorded':money(p.total);
    const note=p.total===null?'KDP + KDP Select tracking is ready; verified Amazon revenue has not been connected yet.':`${p.recordedProjects} book project${p.recordedProjects===1?'':'s'} currently contribute verified recorded revenue${p.bookRows?` across ${p.bookRows} individually tracked book${p.bookRows===1?'':'s'}`:''}.`;
    const anchor=card.querySelector('.hub-project-next')||card.querySelector('.hub-progress-basis');
    anchor?.insertAdjacentHTML('beforebegin',`<div class="books-portfolio-revenue" data-books-revenue-ui><span>Total verified book revenue</span><strong>${esc(text)}</strong><small>${esc(note)}</small></div>`);
  }

  function bookRowsHtml(books){
    if(!books.length) return '';
    return `<div class="book-revenue-list" data-books-revenue-ui>${books.map(b=>`<div class="book-revenue-row"><div class="book-revenue-title">${esc(b.title)}</div><div class="book-revenue-values"><span><small>KDP</small><strong>${b.kdp===null?'Not recorded':esc(money(b.kdp))}</strong></span><span><small>KDP Select / KU</small><strong>${b.select===null?'Not recorded':esc(money(b.select))}</strong></span><span><small>Total</small><strong>${b.total===null?'Not recorded':esc(money(b.total))}</strong></span></div></div>`).join('')}</div>`;
  }

  function decorateCards(){
    document.querySelectorAll('#projectGrid .hub-project-card[data-open^="kdp-"]').forEach(card=>{
      card.querySelectorAll('[data-books-revenue-ui]').forEach(el=>el.remove());
      const id=card.dataset.open;
      const r=projectRevenue(id);
      const anchor=card.querySelector('.hub-project-next')||card.querySelector('.hub-progress-basis')||card.querySelector('.hub-project-open');
      if(!anchor) return;
      const summary=`<div class="book-card-revenue" data-books-revenue-ui><span>Verified revenue</span><strong>${r.total===null?'Not recorded':esc(money(r.total))}</strong><small>KDP royalties${r.kdp===null?' not recorded':`: ${esc(money(r.kdp))}`} • KDP Select / KU${r.select===null?' not recorded':`: ${esc(money(r.select))}`}</small></div>`;
      anchor.insertAdjacentHTML('beforebegin',summary+bookRowsHtml(r.books));
    });
  }

  function currentProject(){
    const name=document.getElementById('detailPanel')?.querySelector('.detail-title')?.textContent?.trim();
    if(!name) return null;
    return cache.projects.find(p=>norm(p.name)===norm(name))||null;
  }

  function decorateDetail(){
    const detail=document.getElementById('detailPanel');
    if(!detail || detail.hidden) return;
    detail.querySelector('#bookRevenuePanel')?.remove();
    const p=currentProject();
    if(!p || !/^kdp-/i.test(p.id)) return;
    const r=projectRevenue(p.id);
    const anchor=detail.querySelector('#projectPerformancePanel')||detail.querySelector('.hub-current-state')||detail.querySelector('.project-meta');
    if(!anchor) return;
    const books=bookRowsHtml(r.books).replace('data-books-revenue-ui','');
    anchor.insertAdjacentHTML('afterend',`<section id="bookRevenuePanel" class="block book-revenue-panel">
      <div class="section-head"><h3>KDP revenue</h3><span class="badge ${r.total!==null?'verified':''}">${r.total!==null?'Verified recorded revenue':'Tracking ready'}</span></div>
      <div class="book-revenue-primary"><div><small>KDP royalties</small><strong>${r.kdp===null?'Not recorded':esc(money(r.kdp))}</strong></div><div><small>KDP Select / KU</small><strong>${r.select===null?'Not recorded':esc(money(r.select))}</strong></div><div><small>Lifetime total</small><strong>${r.total===null?'Not recorded':esc(money(r.total))}</strong></div></div>
      ${books}
      <div class="book-revenue-note">Only verified Amazon revenue is counted. Missing reports stay Not recorded rather than being treated as $0.</div>
    </section>`);
  }

  async function render(force=false){
    await load(force);
    mutating=true;
    try{
      decorateGroup();
      decorateCards();
      decorateDetail();
    }finally{
      setTimeout(()=>{mutating=false;},0);
    }
  }

  function queue(force=false){clearTimeout(timer);timer=setTimeout(()=>render(force),90);}
  const projectView=document.getElementById('projectView');
  if(projectView) new MutationObserver(()=>{if(!mutating)queue(false);}).observe(projectView,{childList:true,subtree:true});
  const detail=document.getElementById('detailPanel');
  if(detail) new MutationObserver(()=>{if(!mutating)queue(false);}).observe(detail,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open],[data-hub-back],[data-books-group],[data-books-back],[data-view]')) queue(false);
    if(e.target.closest('#refreshBtn')) setTimeout(()=>queue(true),1000);
  });
  window.addEventListener('load',()=>queue(true),{once:true});
})();
