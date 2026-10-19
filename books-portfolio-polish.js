(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  let client = null;
  let loading = null;
  let metrics = [];
  let timer = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm = s => String(s || '').trim().toLowerCase();
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
    if(metrics.length && !force) return metrics;
    if(loading) return loading;
    loading=(async()=>{
      const c=await getClient();
      if(!c) return metrics;
      const {data:{session}}=await c.auth.getSession();
      if(!session) return metrics;
      const {data,error}=await c.from('metrics').select('project_id,key,value_text,value_numeric,verified,updated_at').order('updated_at',{ascending:false});
      if(!error) metrics=data||[];
      return metrics;
    })().finally(()=>{loading=null;});
    return loading;
  }

  function orderMap(){
    const map=new Map();
    for(const m of metrics){
      const match=String(m.key||'').match(/^bookmap\.([^.]+)\.metadata$/i);
      if(!match || m.verified!==true) continue;
      const meta=safeJson(m.value_text);
      if(!meta?.title) continue;
      const order=Number(meta.series_order);
      if(Number.isFinite(order)) map.set(norm(meta.title),{order,projectId:m.project_id});
    }
    return map;
  }

  function applyBookOrder(){
    const map=orderMap();
    document.querySelectorAll('.book-revenue-list').forEach(list=>{
      const rows=[...list.querySelectorAll(':scope > .book-revenue-row')];
      const ordered=rows.map((row,index)=>{
        const title=row.querySelector('.book-revenue-title')?.textContent||'';
        const info=map.get(norm(title));
        return {row,index,info};
      });
      const countWithOrder=ordered.filter(x=>x.info).length;
      for(const item of ordered){
        const order=item.info?.order;
        item.row.style.order=Number.isFinite(order)?String(order):String(10000+item.index);
        const wrap=item.row.querySelector('.book-revenue-title-wrap');
        if(wrap){
          if(countWithOrder>1 && Number.isFinite(order)) wrap.dataset.bookSequence=`Book ${order}`;
          else delete wrap.dataset.bookSequence;
        }
      }
    });
  }

  function snapshots(){
    const rows=[];
    for(const m of metrics){
      if(!/^kdp_snapshot\./i.test(String(m.key||'')) || m.verified!==true) continue;
      const data=safeJson(m.value_text);
      if(data) rows.push({metric:m,data});
    }
    rows.sort((a,b)=>String(b.data.checked_at||b.metric.key).localeCompare(String(a.data.checked_at||a.metric.key)));
    const seen=new Set();
    return rows.filter(row=>{
      const d=row.data||{};
      const key=[d.checked_at,d.period_start,d.period_end,d.orders,d.sales,d.royalties_usd,d.kenp].join('|');
      if(seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const n = v => (v!==null && v!==undefined && v!=='' && Number.isFinite(Number(v))) ? Number(v) : null;
  function metricCell(label,value,{currency=false,note='Verified'}={}){
    const ok=value!==null;
    const main=ok?(currency?money(value):whole(value)):'N/A';
    return `<span class="book-metric-cell ${ok?'metric-number':'metric-na'}"><small>${esc(label)}</small><strong>${esc(main)}</strong><em>${esc(ok?note:'Source not verified')}</em></span>`;
  }

  function snapshotHistoryHtml(items){
    if(!items.length) return '<div class="book-revenue-note">No verified KDP snapshot is available yet.</div>';
    const chronological=[...items].reverse();
    const rows=chronological.map((s,i)=>{
      const prev=i?chronological[i-1].data:null;
      const d=s.data;
      const orders=n(d.orders)!==null?n(d.orders):n(d.sales);
      const prevOrders=prev?(n(prev.orders)!==null?n(prev.orders):n(prev.sales)):null;
      const royalties=n(d.royalties_usd), prevRoyalties=prev?n(prev.royalties_usd):null;
      const kenp=n(d.kenp), prevKenp=prev?n(prev.kenp):null;
      const parts=[];
      if(prev){
        if(orders!==null && prevOrders!==null) parts.push(`${orders-prevOrders>=0?'+':''}${whole(orders-prevOrders)} sales`);
        if(royalties!==null && prevRoyalties!==null) parts.push(`${royalties-prevRoyalties>=0?'+':''}${money(royalties-prevRoyalties)} royalties`);
        if(kenp!==null && prevKenp!==null) parts.push(`${kenp-prevKenp>=0?'+':''}${whole(kenp-prevKenp)} KENP`);
      }
      return {data:d,delta:prev?(parts.join(' · ')||'No comparable change'):'Baseline'};
    }).reverse();
    return `<div class="snapshot-history">${rows.map(r=>`<div class="snapshot-row"><strong>${esc(r.data.checked_at||'Snapshot')}</strong><span>${esc(r.delta)}</span><small>${esc(r.data.scope||'KDP Reports')}</small></div>`).join('')}</div>`;
  }

  function portfolioHtml(){
    const items=snapshots();
    const latest=items[0]?.data||null;
    const sales=latest?(n(latest.orders)!==null?n(latest.orders):n(latest.sales)):null;
    const royalties=latest?n(latest.royalties_usd):null;
    const kenp=latest?n(latest.kenp):null;
    const ku=kenp===0?0:null;
    const checked=latest?.checked_at||'Not verified';
    const windowText=latest?[latest.period_start,latest.period_end].filter(Boolean).join(' → '):'N/A';
    const signature=[checked,sales,royalties,kenp,items.length].join('|');
    const html=`<section id="booksPortfolioOverview" class="books-portfolio-overview" data-signature="${esc(signature)}">
      <div class="books-portfolio-heading">
        <div><h3>All Books — Combined KDP Performance</h3><p>Combined verified KDP results across the entire tracked book portfolio.</p></div>
        <span class="badge verified">KDP checked ${esc(checked)}</span>
      </div>
      <div class="book-revenue-primary">
        ${metricCell('Sales / orders',sales)}
        ${metricCell('KDP royalties',royalties,{currency:true})}
        ${metricCell('KDP Select / KU',ku,{currency:true,note:ku===0?'Verified zero from 0 KENP':'Verified'})}
        ${metricCell('KENP',kenp)}
        ${metricCell('Total verified book revenue',royalties,{currency:true})}
      </div>
      <section class="kdp-snapshot-panel">
        <div class="section-head"><h3>KDP snapshot history</h3><span class="badge ${latest?'verified':''}">${esc(latest?checked:'No snapshot')}</span></div>
        <div class="snapshot-grid">
          <div><small>Latest sales / orders</small><strong>${sales===null?'N/A':esc(whole(sales))}</strong></div>
          <div><small>Latest royalties</small><strong>${royalties===null?'N/A':esc(money(royalties))}</strong></div>
          <div><small>Latest KENP</small><strong>${kenp===null?'N/A':esc(whole(kenp))}</strong></div>
          <div><small>Report window</small><strong>${esc(windowText)}</strong></div>
        </div>
        ${snapshotHistoryHtml(items)}
      </section>
    </section>`;
    return {html,signature};
  }

  function renderBooksPortfolio(){
    const toolbar=document.getElementById('booksSubhubToolbar');
    const projectView=document.getElementById('projectView');
    if(!toolbar || !projectView?.classList.contains('books-subhub-active')){
      document.getElementById('booksPortfolioOverview')?.remove();
      return;
    }
    const {html,signature}=portfolioHtml();
    const existing=document.getElementById('booksPortfolioOverview');
    if(existing?.dataset.signature===signature) return;
    if(existing) existing.outerHTML=html;
    else toolbar.insertAdjacentHTML('afterend',html);
  }

  async function render(force=false){
    await load(force);
    applyBookOrder();
    renderBooksPortfolio();
  }

  function queue(force=false){
    clearTimeout(timer);
    timer=setTimeout(()=>render(force),80);
  }

  const view=document.getElementById('projectView');
  if(view) new MutationObserver(()=>queue(false)).observe(view,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-view],[data-open],[data-hub-back],[data-books-group],[data-books-back]')) queue(false);
    if(e.target.closest('#refreshBtn')) setTimeout(()=>queue(true),1000);
  });
  window.addEventListener('load',()=>queue(true),{once:true});
})();
