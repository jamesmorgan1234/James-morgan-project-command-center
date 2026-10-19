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
  const whole = n => new Intl.NumberFormat(undefined,{maximumFractionDigits:0}).format(Number(n || 0));
  const safeJson = s => { try { const v=JSON.parse(String(s||'')); return v && typeof v==='object' ? v : null; } catch { return null; } };

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
  const verifiedNumber = m => !!m && m.verified===true && m.value_numeric!==null && m.value_numeric!==undefined && Number.isFinite(Number(m.value_numeric));
  const numberValue = m => verifiedNumber(m) ? Number(m.value_numeric) : null;
  const metricNumber = (ms,keys) => numberValue(first(ms,keys));
  const zeroVerified = v => v !== null && Number(v)===0;

  function parseLegacyBooks(ms){
    const groups=new Map();
    for(const m of ms){
      const match=String(m.key||'').match(/^book[.:_]([^.:_]+)[.:_](.+)$/i);
      if(!match) continue;
      const slug=match[1], key=match[2];
      if(!groups.has(slug)) groups.set(slug,[]);
      groups.get(slug).push({...m,_key:key});
    }
    return groups;
  }

  function parseBookMappings(ms){
    const out=new Map();
    for(const m of ms){
      const match=String(m.key||'').match(/^bookmap\.([^.]+)\.metadata$/i);
      if(!match || m.verified!==true) continue;
      const meta=safeJson(m.value_text);
      if(meta) out.set(match[1],{...meta,_metric:m});
    }
    return out;
  }

  function inferPublicationState(status){
    const s=norm(status);
    if(!s) return 'unknown';
    if(/not published|not submitted|unpublished|planned|ready/.test(s) && !/published\s*\/\s*live|live\s*[—-]/.test(s)) return 'unpublished';
    if(/\blive\b|\bpublished\b/.test(s) && !/not published|unpublished/.test(s)) return 'published';
    return 'unknown';
  }

  function inferSelectState(status){
    const s=norm(status);
    if(/kdp select enrolled|select enrolled/.test(s)) return 'enrolled';
    if(/kindle intentionally excluded|no kindle|kindle.*not planned/.test(s)) return 'not_applicable';
    if(/not published|not submitted|unpublished|planned|ready/.test(s)) return 'not_published';
    return 'unknown';
  }

  function exactBookMetrics(items){
    const find = rx => items.find(x=>rx.test(x._key));
    const get = rx => numberValue(find(rx));
    return {
      sales:get(/^(sales|orders|book_sales|sales_status)$/i),
      kdp:get(/^(kdp_royalties_usd|kdp_revenue_usd|royalties_usd|kdp_royalties)$/i),
      select:get(/^(kdp_select_earnings_usd|kdp_select_usd|ku_earnings_usd|kindle_unlimited_earnings_usd|select_earnings_usd|ku_royalties_usd)$/i),
      kenp:get(/^(kenp|kenp_pages|ku_pages_read|pages_read)$/i),
      total:get(/^(verified_lifetime_revenue_usd|lifetime_revenue_usd|total_revenue_usd|revenue_usd)$/i)
    };
  }

  function bookCatalog(ms){
    const legacy=parseLegacyBooks(ms);
    const mappings=parseBookMappings(ms);
    const slugs=[...new Set([...mappings.keys(),...legacy.keys()])];
    return slugs.map(slug=>{
      const items=legacy.get(slug)||[];
      const meta=mappings.get(slug)||{};
      const find = rx => items.find(x=>rx.test(x._key));
      const titleMetric=find(/^(title|name|display_name)$/i);
      const statusMetric=find(/^(publication_status|status)$/i);
      const title=meta.title || titleMetric?.value_text || slug.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      const status=meta.publication_status || statusMetric?.value_text || null;
      const publicationState=meta.publication_state || inferPublicationState(status);
      const selectState=meta.kdp_select || inferSelectState(status);
      return {
        slug,title,status,
        publicationState,
        selectState,
        formats:meta.formats||{},
        exact:exactBookMetrics(items),
        mappingVerified:!!mappings.get(slug)
      };
    });
  }

  function parseSnapshots(ms){
    return ms
      .filter(m=>/^kdp_snapshot\./i.test(String(m.key||'')) && m.verified===true)
      .map(m=>({metric:m,data:safeJson(m.value_text)}))
      .filter(x=>x.data)
      .sort((a,b)=>String(b.data.checked_at||b.metric.key).localeCompare(String(a.data.checked_at||a.metric.key)));
  }

  function projectAggregates(ms){
    const snapshots=parseSnapshots(ms);
    const latest=snapshots[0]?.data||null;
    const sales=metricNumber(ms,['sales_status','book_sales','orders_status','orders']);
    const kdp=metricNumber(ms,['kdp_royalties_status','kdp_royalties_usd','kdp_revenue_usd']);
    const select=metricNumber(ms,['ku_royalties_status','kdp_select_earnings_usd','ku_earnings_usd','kindle_unlimited_earnings_usd']);
    const kenp=metricNumber(ms,['kenp_status','kenp_pages','kenp','ku_pages_read']);
    const total=metricNumber(ms,['verified_revenue_usd','verified_lifetime_revenue_usd','lifetime_revenue_usd','kdp_total_revenue_usd']);
    return {
      sales:sales!==null?sales:(latest && Number.isFinite(Number(latest.sales))?Number(latest.sales):latest && Number.isFinite(Number(latest.orders))?Number(latest.orders):null),
      kdp:kdp!==null?kdp:(latest && Number.isFinite(Number(latest.royalties_usd))?Number(latest.royalties_usd):null),
      select,
      kenp:kenp!==null?kenp:(latest && Number.isFinite(Number(latest.kenp))?Number(latest.kenp):null),
      total:total!==null?total:(latest && Number.isFinite(Number(latest.royalties_usd))?Number(latest.royalties_usd):null),
      snapshots
    };
  }

  const na = reason => ({kind:'na',reason});
  const num = (value,provenance='exact') => ({kind:'number',value:Number(value),provenance});

  function resolveBookMetric(book,kind,agg){
    const exact=book.exact?.[kind];
    if(exact!==null && exact!==undefined) return num(exact,'exact');
    if(book.publicationState==='unpublished') return na('Not published');
    if(book.publicationState!=='published') return na('Publication status not verified');

    if(kind==='select' || kind==='kenp'){
      if(book.selectState==='not_applicable') return na('No Kindle / KDP Select edition');
      if(book.selectState==='not_published') return na('Kindle / KDP Select not published');
      if(book.selectState==='unknown') return na('KDP Select status not verified');
    }

    const aggregate=agg[kind];
    if(zeroVerified(aggregate)) return num(0,'inferred-zero');
    if(aggregate!==null) return na('Title-level breakdown not verified');
    return na('Source not verified');
  }

  function enrichBooks(ms){
    const books=bookCatalog(ms);
    const agg=projectAggregates(ms);
    return books.map(book=>{
      const sales=resolveBookMetric(book,'sales',agg);
      const kdp=resolveBookMetric(book,'kdp',agg);
      const select=resolveBookMetric(book,'select',agg);
      const kenp=resolveBookMetric(book,'kenp',agg);
      let total;
      if(book.exact.total!==null && book.exact.total!==undefined) total=num(book.exact.total,'exact');
      else if(book.publicationState==='unpublished') total=na('Not published');
      else if(book.publicationState!=='published') total=na('Publication status not verified');
      else if(zeroVerified(agg.total)) total=num(0,'inferred-zero');
      else if(agg.total!==null) total=na('Title-level breakdown not verified');
      else total=na('Source not verified');
      return {...book,sales,kdp,select,kenp,total};
    });
  }

  function projectPerformance(id){
    const ms=projectMetrics(id);
    const books=enrichBooks(ms);
    const agg=projectAggregates(ms);
    const published=books.filter(b=>b.publicationState==='published').length;
    const unknown=books.filter(b=>b.publicationState==='unknown').length;
    const allUnpublished=books.length>0 && published===0 && unknown===0;
    let totalCell;
    if(allUnpublished) totalCell=na('Not published');
    else if(published===0 && unknown>0) totalCell=na('Publication status not verified');
    else if(agg.total!==null) totalCell=num(agg.total,'project');
    else totalCell=na('Source not verified');
    return {books,agg,published,unknown,totalCell};
  }

  function allSnapshots(){
    const rows=[];
    for(const p of cache.projects.filter(p=>/^kdp-/i.test(p.id))){
      for(const s of parseSnapshots(projectMetrics(p.id))) rows.push({...s,projectId:p.id});
    }
    const seen=new Set();
    return rows.filter(row=>{
      const d=row.data||{};
      const key=[d.checked_at,d.period_start,d.period_end,d.orders,d.sales,d.royalties_usd,d.kenp].join('|');
      if(seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a,b)=>String(b.data.checked_at||'').localeCompare(String(a.data.checked_at||'')));
  }

  function latestPortfolioSnapshot(){ return allSnapshots()[0]?.data||null; }

  function portfolioRevenue(){
    const snapshot=latestPortfolioSnapshot();
    if(snapshot && Number.isFinite(Number(snapshot.royalties_usd))){
      return {total:Number(snapshot.royalties_usd),snapshot,source:'snapshot'};
    }
    const projects=cache.projects.filter(p=>/^kdp-/i.test(p.id));
    const values=projects.map(p=>projectPerformance(p.id).totalCell).filter(c=>c.kind==='number');
    return {total:values.length?values.reduce((s,c)=>s+c.value,0):null,snapshot:null,source:values.length?'projects':null};
  }

  function cellHtml(label,cell,{currency=false}={}){
    const isNum=cell?.kind==='number';
    const main=isNum?(currency?money(cell.value):whole(cell.value)):'N/A';
    const note=isNum?(cell.provenance==='inferred-zero'?'Verified zero':cell.provenance==='exact'?'Verified':'Verified aggregate'):(cell?.reason||'Source not verified');
    return `<span class="book-metric-cell ${isNum?'metric-number':'metric-na'}"><small>${esc(label)}</small><strong>${esc(main)}</strong><em>${esc(note)}</em></span>`;
  }

  function bookRowsHtml(books){
    if(!books.length) return '<div class="book-revenue-empty">No individual book mapping has been recorded yet.</div>';
    return `<div class="book-revenue-list" data-books-revenue-ui>${books.map(b=>`<div class="book-revenue-row">
      <div class="book-revenue-title-wrap">
        <div class="book-revenue-title">${esc(b.title)}</div>
        <small class="book-revenue-status">${esc(b.status||'Publication status not verified')}</small>
      </div>
      <div class="book-revenue-values">
        ${cellHtml('Sales',b.sales)}
        ${cellHtml('KDP royalties',b.kdp,{currency:true})}
        ${cellHtml('KDP Select / KU',b.select,{currency:true})}
        ${cellHtml('KENP',b.kenp)}
        ${cellHtml('Total',b.total,{currency:true})}
      </div>
    </div>`).join('')}</div>`;
  }

  function snapshotSummary(snapshot){
    if(!snapshot) return '';
    const checked=snapshot.checked_at||'—';
    const orders=Number.isFinite(Number(snapshot.orders))?whole(snapshot.orders):Number.isFinite(Number(snapshot.sales))?whole(snapshot.sales):'N/A';
    const royalties=Number.isFinite(Number(snapshot.royalties_usd))?money(snapshot.royalties_usd):'N/A';
    const kenp=Number.isFinite(Number(snapshot.kenp))?whole(snapshot.kenp):'N/A';
    return `KDP checked ${checked} · ${orders} orders · ${royalties} royalties · ${kenp} KENP`;
  }

  function snapshotPanelHtml(snapshots){
    if(!snapshots.length) return `<section class="kdp-snapshot-panel"><div class="section-head"><h3>KDP snapshot history</h3><span class="badge">No snapshot yet</span></div><p class="book-revenue-note">A snapshot will appear after the next verified KDP Reports check.</p></section>`;
    const sorted=[...snapshots].reverse();
    const withDelta=sorted.map((s,i)=>{
      const prev=i?sorted[i-1].data:null, d=s.data;
      const royaltyDelta=prev && Number.isFinite(Number(d.royalties_usd)) && Number.isFinite(Number(prev.royalties_usd)) ? Number(d.royalties_usd)-Number(prev.royalties_usd) : null;
      const orderDelta=prev && Number.isFinite(Number(d.orders)) && Number.isFinite(Number(prev.orders)) ? Number(d.orders)-Number(prev.orders) : null;
      const kenpDelta=prev && Number.isFinite(Number(d.kenp)) && Number.isFinite(Number(prev.kenp)) ? Number(d.kenp)-Number(prev.kenp) : null;
      return {...s,royaltyDelta,orderDelta,kenpDelta,baseline:!prev};
    }).reverse();
    const latest=withDelta[0].data;
    return `<section class="kdp-snapshot-panel">
      <div class="section-head"><h3>KDP snapshot history</h3><span class="badge verified">${esc(latest.checked_at||'Verified')}</span></div>
      <div class="snapshot-grid">
        <div><small>Orders</small><strong>${Number.isFinite(Number(latest.orders))?esc(whole(latest.orders)):'N/A'}</strong></div>
        <div><small>Royalties</small><strong>${Number.isFinite(Number(latest.royalties_usd))?esc(money(latest.royalties_usd)):'N/A'}</strong></div>
        <div><small>KENP</small><strong>${Number.isFinite(Number(latest.kenp))?esc(whole(latest.kenp)):'N/A'}</strong></div>
        <div><small>Report window</small><strong>${esc([latest.period_start,latest.period_end].filter(Boolean).join(' → ')||'N/A')}</strong></div>
      </div>
      <div class="snapshot-history">${withDelta.map(s=>{
        const d=s.data;
        const delta=s.baseline?'Baseline':[
          s.orderDelta!==null?`${s.orderDelta>=0?'+':''}${whole(s.orderDelta)} orders`:null,
          s.royaltyDelta!==null?`${s.royaltyDelta>=0?'+':''}${money(s.royaltyDelta)} royalties`:null,
          s.kenpDelta!==null?`${s.kenpDelta>=0?'+':''}${whole(s.kenpDelta)} KENP`:null
        ].filter(Boolean).join(' · ')||'No comparable delta';
        return `<div class="snapshot-row"><strong>${esc(d.checked_at||'Snapshot')}</strong><span>${esc(delta)}</span><small>${esc(d.scope||'KDP Reports')}</small></div>`;
      }).join('')}</div>
      <div class="book-revenue-note">Snapshots preserve verified KDP checks over time. Account-wide zero totals can safely prove zero for a published title; positive totals are never apportioned to a title without title-level evidence.</div>
    </section>`;
  }

  function decorateGroup(){
    const card=document.querySelector('[data-books-group]');
    if(!card) return;
    card.querySelector('[data-books-revenue-ui]')?.remove();
    const p=portfolioRevenue();
    const text=p.total===null?'N/A':money(p.total);
    const note=p.snapshot?snapshotSummary(p.snapshot):(p.total===null?'KDP revenue source not verified.':'Verified book revenue across tracked KDP projects.');
    const anchor=card.querySelector('.hub-project-next')||card.querySelector('.hub-progress-basis');
    anchor?.insertAdjacentHTML('beforebegin',`<div class="books-portfolio-revenue" data-books-revenue-ui><span>Total verified book revenue</span><strong>${esc(text)}</strong><small>${esc(note)}</small></div>`);
  }

  function decorateCards(){
    document.querySelectorAll('#projectGrid .hub-project-card[data-open^="kdp-"]').forEach(card=>{
      card.querySelectorAll('[data-books-revenue-ui]').forEach(el=>el.remove());
      const id=card.dataset.open;
      const r=projectPerformance(id);
      const anchor=card.querySelector('.hub-project-next')||card.querySelector('.hub-progress-basis')||card.querySelector('.hub-project-open');
      if(!anchor) return;
      const total=r.totalCell.kind==='number'?money(r.totalCell.value):'N/A';
      const totalNote=r.totalCell.kind==='number'?'Verified KDP revenue':r.totalCell.reason;
      const latest=r.agg.snapshots[0]?.data||null;
      const summary=`<div class="book-card-revenue" data-books-revenue-ui><span>Verified revenue</span><strong>${esc(total)}</strong><small>${esc(totalNote)}${latest?` • ${esc(snapshotSummary(latest))}`:''}</small></div>`;
      anchor.insertAdjacentHTML('beforebegin',summary+bookRowsHtml(r.books));
    });
  }

  function currentProject(){
    const name=document.getElementById('detailPanel')?.querySelector('.detail-title')?.textContent?.trim();
    if(!name) return null;
    return cache.projects.find(p=>norm(p.name)===norm(name))||null;
  }

  function primaryCell(kind,agg,books){
    const published=books.filter(b=>b.publicationState==='published').length;
    const unknown=books.filter(b=>b.publicationState==='unknown').length;
    if(books.length && published===0 && unknown===0) return na('Not published');
    if(published===0 && unknown>0) return na('Publication status not verified');
    if(kind==='select' || kind==='kenp'){
      const liveBooks=books.filter(b=>b.publicationState==='published');
      if(liveBooks.length && !unknown && liveBooks.every(b=>b.selectState==='not_applicable')) return na('No Kindle / KDP Select edition');
    }
    const v=agg[kind];
    return v!==null?num(v,'project'):na('Source not verified');
  }

  function decorateDetail(){
    const detail=document.getElementById('detailPanel');
    if(!detail || detail.hidden) return;
    detail.querySelector('#bookRevenuePanel')?.remove();
    detail.querySelector('#kdpSnapshotPanel')?.remove();
    const p=currentProject();
    if(!p || !/^kdp-/i.test(p.id)) return;
    const r=projectPerformance(p.id);
    const anchor=detail.querySelector('#projectPerformancePanel')||detail.querySelector('.hub-current-state')||detail.querySelector('.project-meta');
    if(!anchor) return;

    const projectSales=primaryCell('sales',r.agg,r.books);
    const projectKdp=primaryCell('kdp',r.agg,r.books);
    const projectSelect=primaryCell('select',r.agg,r.books);
    const projectKenp=primaryCell('kenp',r.agg,r.books);
    const total=r.totalCell;

    anchor.insertAdjacentHTML('afterend',`<section id="bookRevenuePanel" class="block book-revenue-panel">
      <div class="section-head"><h3>KDP performance</h3><span class="badge ${total.kind==='number'?'verified':''}">${total.kind==='number'?'Verified':'Mapped'}</span></div>
      <div class="book-revenue-primary">
        ${cellHtml('Sales',projectSales)}
        ${cellHtml('KDP royalties',projectKdp,{currency:true})}
        ${cellHtml('KDP Select / KU',projectSelect,{currency:true})}
        ${cellHtml('KENP',projectKenp)}
        ${cellHtml('Total',total,{currency:true})}
      </div>
      ${bookRowsHtml(r.books).replace('data-books-revenue-ui','')}
      <div class="book-revenue-note">Book-level values distinguish verified zero from N/A. Unpublished titles are N/A, structurally inapplicable KU is N/A, and positive project totals are never assigned to an individual title without title-level evidence.</div>
    </section>`);
    detail.querySelector('#bookRevenuePanel')?.insertAdjacentHTML('afterend',snapshotPanelHtml(r.agg.snapshots).replace('<section class="kdp-snapshot-panel"','<section id="kdpSnapshotPanel" class="kdp-snapshot-panel"'));
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
