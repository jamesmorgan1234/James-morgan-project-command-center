(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let client = null;
  let cache = { projects: [], metrics: [] };
  let loading = null;
  let timer = null;

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
        c.from('projects').select('id,name,next_action,status,stage,verification'),
        c.from('metrics').select('project_id,key,label,value_numeric,value_text,unit,verified,source,updated_at').order('updated_at',{ascending:false})
      ]);
      if(!p.error && !m.error) cache={projects:p.data||[],metrics:m.data||[]};
      return cache;
    })().finally(()=>{loading=null;});
    return loading;
  }

  function display(m, fallback='Not recorded'){
    if(!m) return fallback;
    if(m.value_numeric!==null && m.value_numeric!==undefined){
      if(String(m.unit||'').toUpperCase()==='USD') return money(m.value_numeric);
      return `${m.value_numeric}${m.unit?` ${m.unit}`:''}`;
    }
    return m.value_text || fallback;
  }

  function currentProject(){
    const name=$('detailPanel')?.querySelector('.detail-title')?.textContent?.trim();
    if(!name) return null;
    return cache.projects.find(p=>norm(p.name)===norm(name))||null;
  }

  function projectMetrics(id){ return cache.metrics.filter(m=>m.project_id===id); }
  function first(ms,keys){ for(const key of keys){ const m=ms.find(x=>x.key===key); if(m) return m; } return null; }
  function revenueMetric(ms){
    for(const key of ['verified_lifetime_revenue_usd','lifetime_revenue_usd','verified_revenue_usd']){
      const m=ms.find(x=>x.key===key && x.verified===true && x.value_numeric!==null && x.value_numeric!==undefined);
      if(m) return m;
    }
    return null;
  }
  function subscriberMetric(ms){ return first(ms,['subscriber_count','subscribers','subscriber_status']); }
  function customersMetric(ms){ return first(ms,['customer_count','customers']); }
  function salesMetric(ms){ return first(ms,['lifetime_sales','sales_count','orders','order_count','purchases','product_downloads_checkpoint']); }
  function audienceMetric(ms){ return first(ms,['followers','follower_count','views','lifetime_views','subscribers','subscriber_count']); }

  function extraKpis(ms){
    const rx=/(subscriber|customer|sale|order|purchase|download|follower|view|stream|member|booking|lead|conversion|tip|revenue|profit)/i;
    const skip=new Set(['verified_lifetime_revenue_usd','lifetime_revenue_usd','verified_revenue_usd']);
    const seen=new Set();
    return ms.filter(m=>!skip.has(m.key)&&!/^model[.:_]/i.test(m.key||'')&&!/^(category|product)[.:_]/i.test(m.key||'')&&rx.test(`${m.key} ${m.label}`))
      .filter(m=>{if(seen.has(m.key))return false;seen.add(m.key);return true;}).slice(0,6);
  }

  function groupedBreakdown(ms,prefix){
    const groups=new Map();
    for(const m of ms){
      const match=String(m.key||'').match(new RegExp(`^${prefix}[.:_]([^.:_]+)[.:_](.+)$`,'i'));
      if(!match) continue;
      const slug=match[1], key=match[2];
      if(!groups.has(slug)) groups.set(slug,[]);
      groups.get(slug).push({...m,_key:key});
    }
    return [...groups.entries()].map(([slug,items])=>{
      const nm=items.find(x=>/^(name|display_name|label)$/i.test(x._key));
      const rev=items.find(x=>/^(verified_lifetime_revenue_usd|lifetime_revenue_usd|verified_revenue_usd|revenue|revenue_usd)$/i.test(x._key));
      const sales=items.find(x=>/^(sales|sales_count|lifetime_sales|orders|order_count|purchases)$/i.test(x._key));
      const units=items.find(x=>/^(downloads|download_count|units|units_sold)$/i.test(x._key));
      const name=nm?.value_text||slug.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      return {name,rev,sales,units};
    });
  }

  function modelGroups(ms){
    const groups=new Map();
    for(const m of ms){
      const match=String(m.key||'').match(/^model[.:_]([^.:_]+)[.:_](.+)$/i);
      if(!match) continue;
      const slug=match[1], key=match[2];
      if(!groups.has(slug)) groups.set(slug,[]);
      groups.get(slug).push({...m,_key:key});
    }
    return [...groups.entries()].map(([slug,items])=>{
      const nm=items.find(x=>/^(name|display_name)$/i.test(x._key));
      const rev=items.find(x=>/^(verified_lifetime_revenue_usd|lifetime_revenue_usd|verified_revenue_usd|revenue)$/i.test(x._key));
      const subs=items.find(x=>/^(subscriber_count|subscribers|subscriber_status)$/i.test(x._key));
      return {name:nm?.value_text||slug.replace(/[-_]+/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),rev,subs};
    });
  }

  function fanvueFallback(p,ms){
    if(p.id!=='fanvue-veyla') return [];
    return [{name:'Veyla Serin',rev:revenueMetric(ms),subs:subscriberMetric(ms)}];
  }

  function sourceLine(ms){
    const sources=[...new Set(ms.filter(m=>m.verified===true && m.source).map(m=>m.source))];
    return sources.length ? `Verified sources on file: ${sources.slice(0,3).join(' • ')}` : 'No live verified analytics source is connected yet.';
  }

  function commerceBreakdownHtml(p,ms){
    const categories=groupedBreakdown(ms,'category');
    const products=groupedBreakdown(ms,'product');
    const rows=categories.length?categories:products;
    if(rows.length){
      return `<div class="perf-commerce"><div class="perf-subhead">Sales breakdown</div><div class="perf-sales-list">${rows.map(x=>`<div class="perf-sales-row"><div class="perf-sales-name">${esc(x.name)}</div><div class="perf-sales-stat"><small>Sales / orders</small><strong>${esc(x.sales?display(x.sales):x.units?display(x.units):'Not recorded')}</strong></div><div class="perf-sales-stat"><small>Lifetime revenue</small><strong>${esc(x.rev?display(x.rev):'Not recorded')}</strong></div></div>`).join('')}</div></div>`;
    }
    if(p.id==='margincrafttools'){
      const checkpoint=first(ms,['revenue_checkpoint']);
      const downloads=first(ms,['product_downloads_checkpoint']);
      return `<div class="perf-commerce"><div class="perf-subhead">Sales breakdown</div><div class="perf-sales-empty"><strong>Category-level sales are not connected yet.</strong><span>Latest verified checkpoint: ${esc(checkpoint?display(checkpoint):'Not recorded')} paid revenue${downloads?` • ${esc(display(downloads))} downloads`:''}. This checkpoint is historical, not a live lifetime total.</span></div></div>`;
    }
    return '';
  }

  async function render(force=false){
    await load(force);
    const detail=$('detailPanel');
    if(!detail || detail.hidden) return;
    const p=currentProject();
    if(!p) return;
    const ms=projectMetrics(p.id);
    const rev=revenueMetric(ms);
    const subscribers=subscriberMetric(ms);
    const customers=customersMetric(ms);
    const sales=salesMetric(ms);
    const audience=audienceMetric(ms);
    const extras=extraKpis(ms);
    const models=modelGroups(ms);
    const modelList=models.length?models:fanvueFallback(p,ms);

    detail.querySelector('#projectPerformancePanel')?.remove();
    const anchor=detail.querySelector('.hub-current-state') || detail.querySelector('.project-meta');
    if(!anchor) return;

    const primary=[
      ['Lifetime revenue', rev?display(rev):'Not recorded'],
      [subscribers?'Subscribers':customers?'Customers':'Audience', subscribers?display(subscribers):customers?display(customers):audience?display(audience):'Not recorded'],
      ['Sales / orders', sales?display(sales):'Not recorded']
    ];

    const modelHtml=modelList.length?`<div class="perf-models"><div class="perf-subhead">${p.id==='fanvue-veyla'?'Models':'Breakdown'}</div>${modelList.map(x=>`<div class="perf-model-card"><div class="perf-model-name">${esc(x.name)}</div><div class="perf-model-stats"><span><small>Subscribers</small><strong>${esc(x.subs?display(x.subs):'Not recorded')}</strong></span><span><small>Lifetime revenue</small><strong>${esc(x.rev&&x.rev.verified===true?display(x.rev):'Not recorded')}</strong></span></div></div>`).join('')}</div>`:'';
    const commerceHtml=commerceBreakdownHtml(p,ms);
    const extraHtml=extras.length?`<div class="perf-extra-grid">${extras.map(m=>`<div class="perf-mini"><small>${esc(m.label||m.key)}</small><strong>${esc(display(m))}</strong></div>`).join('')}</div>`:'';

    anchor.insertAdjacentHTML('afterend',`<section id="projectPerformancePanel" class="block performance-panel">
      <div class="section-head"><h3>Lifetime performance</h3><span class="badge ${rev?'verified':''}">${rev?'Verified data':'Tracking ready'}</span></div>
      <div class="perf-primary-grid">${primary.map(([k,v])=>`<div class="perf-primary"><small>${esc(k)}</small><strong>${esc(v)}</strong></div>`).join('')}</div>
      ${modelHtml}
      ${commerceHtml}
      ${extraHtml}
      <div class="perf-source">${esc(sourceLine(ms))}</div>
    </section>`);
  }

  function queue(force=false){ clearTimeout(timer); timer=setTimeout(()=>render(force),80); }
  const detail=$('detailPanel');
  if(detail) new MutationObserver(()=>queue(false)).observe(detail,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-open],[data-continue],[data-hub-back],[data-books-group],[data-books-back]')) queue(false);
    if(e.target.closest('#refreshBtn')) setTimeout(()=>queue(true),800);
  });
  window.addEventListener('load',()=>queue(true),{once:true});
})();
