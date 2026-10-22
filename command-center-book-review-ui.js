(() => {
  if (window.COMMAND_CENTER_BOOK_REVIEW_UI) return;
  window.COMMAND_CENTER_BOOK_REVIEW_UI = { version: 1 };
  const ACTIVE=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const TOOLS=['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  let busy=false, timer=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const c=()=>window.COMMAND_CENTER_SUPABASE||null;
  async function auth(){const x=c();if(!x)return null;const {data:{session}}=await x.auth.getSession();if(!session?.user)return null;const gate=await x.rpc('is_command_center_authorized');return gate.error||!gate.data?null:session.user;}
  async function rpc(name,args={}){const x=c(),u=await auth();if(!x||!u)throw new Error('Authorized Command Center session required.');const r=await x.rpc(name,args);if(r.error)throw r.error;return r.data;}
  function currentProjectId(){return window.history.state?.projectId||document.querySelector('#ccApprovedApp [data-cc-project-detail-id]')?.dataset.ccProjectDetailId||null;}
  function bookRows(kpis){return (kpis||[]).filter(r=>/^bookmap\..+\.metadata$/.test(r.metric_key)).map(r=>{try{return JSON.parse(r.value_text||'{}')}catch{return null}}).filter(Boolean).sort((a,b)=>(a.series_order||99)-(b.series_order||99)||String(a.title||'').localeCompare(String(b.title||'')));}
  function latestByBook(rows){const map=new Map();for(const r of rows||[]){const cur=map.get(r.book_title);if(!cur||Number(r.revision)>Number(cur.revision))map.set(r.book_title,r);}return map;}
  function isOpenable(ref){return /^(https?:\/\/|\.\/|\/)/i.test(String(ref||''));}
  function statusLabel(r){if(!r)return'Not prepared';if(r.status==='approved')return'Approved & locked';if(r.status==='needs_changes')return'Needs changes';return'Awaiting your review';}
  function cardHtml(project,books,reviews){
    const selected=sessionStorage.getItem(`cc-book-review:${project.id}`)||books[0]?.title||'';
    const book=books.find(b=>b.title===selected)||books[0];
    const review=reviews.get(book?.title);
    const revision=review?.revision||1;
    const artifact=review?.artifact_label||review?.artifact_ref||'No final PDF reference recorded yet';
    const open=isOpenable(review?.artifact_ref);
    let actions='';
    if(!review){
      actions='<button type="button" class="cc-book-review-primary" data-book-review-prepare>Prepare PDF for Review</button>';
    } else if(review.status==='pending_review'){
      actions=`${open?'<button type="button" data-book-review-open>Open Final PDF</button>':''}<button type="button" class="cc-book-review-primary" data-book-review-approve>Approve Final</button><button type="button" data-book-review-changes-toggle>Needs Changes</button>`;
    } else if(review.status==='approved'){
      actions=`${open?'<button type="button" data-book-review-open>Open Approved PDF</button>':''}<button type="button" data-book-review-changes-toggle>Reopen · Needs Changes</button>`;
    } else {
      actions='<button type="button" class="cc-book-review-primary" data-book-review-correct>Run Correction with Agent</button>';
    }
    return `<section id="ccBookReviewGate" class="cc-approved-section cc-book-review-gate" data-project-id="${esc(project.id)}"><div class="cc-approved-section-title"><span class="cc-approved-emblem" aria-hidden="true">✓</span><strong>FINAL BOOK REVIEW</strong><span>PC REQUIRED</span></div>
      <label class="cc-book-review-select">Book<select data-book-review-select>${books.map(b=>`<option value="${esc(b.title)}"${b.title===book?.title?' selected':''}>${esc(b.title)}</option>`).join('')}</select></label>
      <div class="cc-book-review-status"><div><small>Status</small><strong>${esc(statusLabel(review))}</strong></div><div><small>Revision</small><strong>${review?`Rev ${revision}`:'—'}</strong></div></div>
      <div class="cc-book-review-artifact"><small>Exact reviewed artifact</small><strong>${esc(artifact)}</strong>${review?.artifact_hash?`<span>Hash ${esc(String(review.artifact_hash).slice(0,16))}…</span>`:''}</div>
      ${review?.feedback?`<div class="cc-book-review-feedback"><small>Your requested changes</small><p>${esc(review.feedback)}</p></div>`:''}
      <p class="cc-book-review-note">Generating a PDF is not approval. Inspect the exact final PDF on your computer, then approve it here. Approval locks that exact book revision in Brain. Publishing remains a separate rollout step.</p>
      <div class="cc-book-review-actions">${actions}</div>
      <form data-book-review-changes-form hidden><textarea rows="3" placeholder="Tell Agent exactly what needs changed…"></textarea><button type="submit" class="cc-book-review-primary">Send Changes to Agent</button></form>
      <div class="cc-book-review-message" data-book-review-message></div></section>`;
  }
  async function activeSession(projectId){const rows=await rpc('command_center_agent_list_sessions',{p_project_id:projectId})||[];return rows.find(x=>ACTIVE.has(x.status))||null;}
  async function startAgent(project,book,review,kind,feedback=''){
    const active=await activeSession(project.id);if(active)throw new Error('Agent is already working on this project. Your review state is saved.');
    const nextRevision=(review?.revision||0)+1;
    const objective=kind==='prepare'
      ? `Prepare the exact final review PDF/package for ${book.title} in ${project.name}. Perform full production QC. When the exact final artifact is ready, record it with command_center_book_review_set using project ${project.id}, book title ${book.title}, revision ${nextRevision}, and the exact artifact label/reference/hash. Then stop at PC REQUIRED for James Morgan to inspect the PDF. Do not treat file generation as approval and do not publish.`
      : `Revise ${book.title} in ${project.name} using James Morgan's owner PDF review feedback: ${feedback}. Preserve all approved work except the requested corrections. Perform full production QC, create the corrected exact final PDF/package, then record revision ${nextRevision} with command_center_book_review_set including the exact artifact label/reference/hash. Stop at PC REQUIRED for James to inspect the corrected PDF. Do not publish and do not self-approve.`;
    return rpc('command_center_agent_create_project_only_session',{p_objective:objective,p_project_id:project.id,p_success_criteria:[],p_excluded_scope:[],p_allowed_tool_categories:TOOLS,p_allow_work:false,p_books_target:book.title,p_dry_run:false});
  }
  async function mount(){
    if(busy)return;busy=true;
    try{
      const host=document.getElementById('ccApprovedApp'),anchor=document.getElementById('ccApprovedAgentMount'),projectId=currentProjectId();
      if(!host||!anchor||!projectId){document.getElementById('ccBookReviewGate')?.remove();return;}
      const x=c(),u=await auth();if(!x||!u)return;
      const [p,k,r]=await Promise.all([
        x.from('projects').select('id,name,category').eq('id',projectId).maybeSingle(),
        x.from('analytics_project_kpis').select('metric_key,value_text').eq('project_id',projectId).eq('verified',true),
        x.from('book_owner_reviews').select('*').eq('project_id',projectId).order('revision',{ascending:false})
      ]);
      if(p.error||k.error||r.error||!p.data)return;
      const books=bookRows(k.data);if(!books.length){document.getElementById('ccBookReviewGate')?.remove();return;}
      const reviews=latestByBook(r.data);
      let gate=document.getElementById('ccBookReviewGate');
      const holder=document.createElement('div');holder.innerHTML=cardHtml(p.data,books,reviews);const fresh=holder.firstElementChild;
      if(gate)gate.replaceWith(fresh);else anchor.insertAdjacentElement('beforebegin',fresh);gate=fresh;
      const selected=()=>{const title=gate.querySelector('[data-book-review-select]')?.value||books[0].title;return {book:books.find(b=>b.title===title)||books[0],review:reviews.get(title)||null};};
      gate.querySelector('[data-book-review-select]')?.addEventListener('change',e=>{sessionStorage.setItem(`cc-book-review:${projectId}`,e.target.value);schedule(0);});
      gate.querySelector('[data-book-review-open]')?.addEventListener('click',()=>{const {review}=selected();if(review?.artifact_ref&&isOpenable(review.artifact_ref))window.open(review.artifact_ref,'_blank','noopener');});
      gate.querySelector('[data-book-review-prepare]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{book,review}=selected();e.currentTarget.disabled=true;msg.textContent='Preparing Agent review run…';try{await startAgent(p.data,book,review,'prepare');msg.textContent='Agent queued. It will stop at PC REQUIRED when the exact final PDF is ready.';}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
      gate.querySelector('[data-book-review-approve]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{review}=selected();if(!review)return;e.currentTarget.disabled=true;msg.textContent='Locking approved final…';try{await rpc('command_center_book_review_approve',{p_review_id:review.id});msg.textContent='Approved and locked as the final reviewed book.';schedule(100);}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
      gate.querySelector('[data-book-review-changes-toggle]')?.addEventListener('click',()=>{const form=gate.querySelector('[data-book-review-changes-form]');form.hidden=!form.hidden;if(!form.hidden)form.querySelector('textarea')?.focus({preventScroll:true});});
      gate.querySelector('[data-book-review-changes-form]')?.addEventListener('submit',async e=>{e.preventDefault();const msg=gate.querySelector('[data-book-review-message]'),feedback=e.currentTarget.querySelector('textarea')?.value.trim()||'',{book,review}=selected();if(!review||!feedback){msg.textContent='Describe exactly what needs changed first.';return;}const btn=e.currentTarget.querySelector('button');btn.disabled=true;msg.textContent='Saving your changes…';try{await rpc('command_center_book_review_needs_changes',{p_review_id:review.id,p_feedback:feedback});try{await startAgent(p.data,book,review,'correct',feedback);msg.textContent='Changes saved and correction run queued.';}catch(agentErr){msg.textContent=`Changes saved. ${agentErr.message||String(agentErr)}`;}schedule(150);}catch(err){msg.textContent=err.message||String(err);btn.disabled=false;}});
      gate.querySelector('[data-book-review-correct]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{book,review}=selected();e.currentTarget.disabled=true;msg.textContent='Starting correction run…';try{await startAgent(p.data,book,review,'correct',review?.feedback||'Apply the recorded owner review changes.');msg.textContent='Correction run queued.';}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
    }finally{busy=false;}
  }
  function schedule(ms=120){clearTimeout(timer);timer=setTimeout(mount,ms);}
  const observer=new MutationObserver(m=>{if(m.some(x=>![...x.addedNodes].some(n=>n?.id==='ccBookReviewGate'||n?.closest?.('#ccBookReviewGate'))))schedule();});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('popstate',()=>schedule(80));
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(100);});
  window.addEventListener('command-center:book-review-refresh',()=>schedule(0));
  setTimeout(mount,900);
})();
