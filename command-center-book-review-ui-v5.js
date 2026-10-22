(() => {
  if (window.COMMAND_CENTER_BOOK_REVIEW_UI_V5) return;
  const api = window.COMMAND_CENTER_BOOK_REVIEW_UI_V5 = { version: 5 };

  const ACTIVE=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const TOOLS=['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const FORMATS=[['kindle','Kindle eBook'],['kdp_select','KDP Select'],['paperback','Paperback'],['hardcover','Hardcover']];
  let busy=false,timer=null,lastProjectId=null;

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const client=()=>window.COMMAND_CENTER_SUPABASE||null;

  async function auth(){
    const c=client();if(!c)return null;
    const {data:{session}}=await c.auth.getSession();if(!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized');
    return gate.error||!gate.data?null:session.user;
  }
  async function rpc(name,args={}){
    const c=client(),u=await auth();
    if(!c||!u)throw new Error('Authorized Command Center session required.');
    const {data,error}=await c.rpc(name,args);if(error)throw error;return data;
  }
  function currentProjectId(){return window.history.state?.projectId||null;}
  function bookRows(kpis){return (kpis||[]).filter(r=>/^bookmap\..+\.metadata$/.test(r.metric_key)).map(r=>{try{return JSON.parse(r.value_text||'{}')}catch{return null}}).filter(Boolean).sort((a,b)=>(a.series_order||99)-(b.series_order||99)||String(a.title||'').localeCompare(String(b.title||'')));}
  function latestByBook(rows){const map=new Map();for(const r of rows||[]){const cur=map.get(r.book_title);if(!cur||Number(r.revision)>Number(cur.revision))map.set(r.book_title,r);}return map;}
  function publicationMap(rows){const map=new Map();for(const r of rows||[]){if(!map.has(r.book_title))map.set(r.book_title,new Set());map.get(r.book_title).add(r.format);}return map;}
  function isOpenable(ref){return /^(https?:\/\/|\.\/|\/)/i.test(String(ref||''));}
  function metaPublished(book){return String(book?.publication_state||'').toLowerCase()==='published'||['kindle','paperback','hardcover'].some(f=>String(book?.formats?.[f]||'').toLowerCase()==='live')||String(book?.kdp_select||'').toLowerCase()==='enrolled';}
  function effectivePublished(book,pubs){return metaPublished(book)||(pubs.get(book?.title)?.size||0)>0;}
  function publishedFormats(book,pubs){const set=new Set(pubs.get(book?.title)||[]);if(String(book?.formats?.kindle||'').toLowerCase()==='live')set.add('kindle');if(String(book?.kdp_select||'').toLowerCase()==='enrolled')set.add('kdp_select');if(String(book?.formats?.paperback||'').toLowerCase()==='live')set.add('paperback');if(String(book?.formats?.hardcover||'').toLowerCase()==='live')set.add('hardcover');return set;}
  function statusLabel(review,book,pubs){if(review?.status==='needs_changes')return'Needs changes';if(review?.status==='pending_review')return'Awaiting your review';if(review?.status==='approved'&&effectivePublished(book,pubs))return'Published / locked';if(review?.status==='approved')return'Approved Final · Publish Queue';if(effectivePublished(book,pubs))return'Published / locked';return'Not prepared';}
  function formatSummary(book,pubs){const set=publishedFormats(book,pubs);return FORMATS.filter(([key])=>set.has(key)).map(([,label])=>label).join(' · ')||'Not marked published';}
  function queueCount(books,reviews,pubs){return books.filter(b=>reviews.get(b.title)?.status==='approved'&&!effectivePublished(b,pubs)).length;}

  function publicationChecklist(books,reviews,selectedTitle){
    const approved=books.filter(b=>reviews.get(b.title)?.status==='approved');
    if(!approved.length)return'';
    return `<form class="cc-book-publish-form" data-book-publish-form hidden><div class="cc-book-review-subhead">MARK WHAT IS ALREADY LIVE</div><div class="cc-book-publish-books">${approved.map(b=>`<label><input type="checkbox" name="book" value="${esc(b.title)}"${b.title===selectedTitle?' checked':''}><span>${esc(b.title)}</span></label>`).join('')}</div><div class="cc-book-publish-formats">${FORMATS.map(([key,label])=>`<label><input type="checkbox" name="format" value="${key}"><span>${label}</span></label>`).join('')}</div><button type="submit" class="cc-book-review-primary">Confirm Published</button><p>Records what you already published. This does not submit anything to KDP.</p></form>`;
  }

  function cardHtml(project,books,reviews,pubs){
    const selected=sessionStorage.getItem(`cc-book-review:${project.id}`)||books[0]?.title||'';
    const book=books.find(b=>b.title===selected)||books[0];
    const review=reviews.get(book?.title);
    const alreadyPublished=effectivePublished(book,pubs);
    const revision=review?.revision||1;
    const artifact=review?.artifact_label||review?.artifact_ref||(alreadyPublished?'Existing verified published record':'No final PDF reference recorded yet');
    const open=isOpenable(review?.artifact_ref);
    const queued=queueCount(books,reviews,pubs);
    let actions='';
    if(!review&&alreadyPublished)actions='<button type="button" data-book-review-reopen-legacy>Reopen Book for Changes</button>';
    else if(!review)actions='<button type="button" class="cc-book-review-primary" data-book-review-prepare>Prepare PDF for Review</button>';
    else if(review.status==='pending_review')actions=`${open?'<button type="button" data-book-review-open>Open Final PDF</button>':''}<button type="button" class="cc-book-review-primary" data-book-review-approve>Approve Final</button><button type="button" data-book-review-changes-toggle>Needs Changes</button>`;
    else if(review.status==='approved'&&!alreadyPublished)actions=`${open?'<button type="button" data-book-review-open>Open Approved PDF</button>':''}<button type="button" class="cc-book-review-primary" data-book-publish-toggle>Mark Published</button><button type="button" data-book-review-changes-toggle>Reopen · Needs Changes</button>`;
    else if(review.status==='approved')actions=`${open?'<button type="button" data-book-review-open>Open Approved PDF</button>':''}<button type="button" data-book-publish-toggle>Update Published Formats</button><button type="button" data-book-review-changes-toggle>Reopen Book for Changes</button>`;
    else actions='<button type="button" class="cc-book-review-primary" data-book-review-correct>Run Correction with Agent</button>';

    return `<section id="ccBookReviewGate" class="cc-approved-section cc-book-review-gate" data-project-id="${esc(project.id)}"><div class="cc-approved-section-title"><span class="cc-approved-emblem" aria-hidden="true">✓</span><strong>FINAL BOOK REVIEW</strong><span>${alreadyPublished?'PUBLISHED':review?.status==='approved'?'PUBLISH QUEUE':'PC REQUIRED'}</span></div>${queued?`<div class="cc-book-publish-queue"><strong>${queued}</strong><span>Approved final ${queued===1?'book':'books'} waiting for rollout</span><small>Finished and locked until your publication slot is available.</small></div>`:''}<label class="cc-book-review-select">Book<select data-book-review-select>${books.map(b=>`<option value="${esc(b.title)}"${b.title===book?.title?' selected':''}>${esc(b.title)}</option>`).join('')}</select></label><div class="cc-book-review-status"><div><small>Status</small><strong>${esc(statusLabel(review,book,pubs))}</strong></div><div><small>Published formats</small><strong>${esc(formatSummary(book,pubs))}</strong></div></div><div class="cc-book-review-artifact"><small>Exact reviewed artifact</small><strong>${esc(artifact)}</strong>${review?.artifact_hash?`<span>Hash ${esc(String(review.artifact_hash).slice(0,16))}…</span>`:''}${review?`<span>Revision ${revision}</span>`:''}</div>${review?.feedback?`<div class="cc-book-review-feedback"><small>Your requested changes</small><p>${esc(review.feedback)}</p></div>`:''}<p class="cc-book-review-note">Generating a PDF is not approval. Inspect the exact final PDF on your computer, then approve it here. <strong>Approved Final</strong> means the book is finished, locked, and waiting in your publication queue for the allowed rollout slot. After you actually publish it, use Mark Published to record the formats that went live. Publishing itself stays separate.</p><div class="cc-book-review-actions">${actions}</div>${publicationChecklist(books,reviews,book?.title)}<form data-book-review-changes-form hidden><textarea rows="3" placeholder="Tell Agent exactly what needs changed…"></textarea><button type="submit" class="cc-book-review-primary">Send Changes to Agent</button></form><form data-book-review-legacy-form hidden><textarea rows="3" placeholder="What needs changed in this already-published book?"></textarea><button type="submit" class="cc-book-review-primary">Reopen Book</button></form><div class="cc-book-review-message" data-book-review-message></div></section>`;
  }

  async function activeSession(projectId){const rows=await rpc('command_center_agent_list_sessions',{p_project_id:projectId})||[];return rows.find(x=>ACTIVE.has(x.status))||null;}
  async function startAgent(project,book,review,kind,feedback=''){
    const active=await activeSession(project.id);if(active)throw new Error('An Agent session already exists for this project. Stop or finish it before starting another book run.');
    const nextRevision=(review?.revision||0)+1;
    const objective=kind==='prepare'?`Prepare the exact final review PDF/package for ${book.title} in ${project.name}. Perform full production QC. When the exact final artifact is ready, record it with command_center_book_review_set using project ${project.id}, book title ${book.title}, revision ${nextRevision}, and the exact artifact label/reference/hash. Then stop at PC REQUIRED for James Morgan to inspect the PDF. Do not treat file generation as approval and do not publish.`:`Revise ${book.title} in ${project.name} using James Morgan's owner PDF review feedback: ${feedback}. Preserve all approved work except the requested corrections. Perform full production QC, create the corrected exact final PDF/package, then record revision ${nextRevision} with command_center_book_review_set including the exact artifact label/reference/hash. Stop at PC REQUIRED for James to inspect the corrected PDF. Do not publish and do not self-approve.`;
    const result=await rpc('command_center_agent_create_project_only_session',{p_objective:objective,p_project_id:project.id,p_success_criteria:[],p_excluded_scope:[],p_allowed_tool_categories:TOOLS,p_allow_work:false,p_books_target:book.title,p_dry_run:false});
    window.COMMAND_CENTER_AGENT_TRUTH?.refresh?.();
    return result;
  }

  function applyPublicationTiles(host,books,pubs){
    const cells=host.querySelectorAll('.cc-approved-publication > div');if(cells.length<4)return;
    const counts={kindle:0,kdp_select:0,paperback:0,hardcover:0};
    for(const b of books){const set=publishedFormats(b,pubs);for(const key of Object.keys(counts))if(set.has(key))counts[key]++;}
    ['kindle','kdp_select','paperback','hardcover'].forEach((key,i)=>{const strong=cells[i]?.querySelector('strong'),span=cells[i]?.querySelector('span');if(strong)strong.textContent=`${counts[key]} / ${books.length}`;if(span)span.textContent=counts[key]===books.length?'Published':'Current';});
  }

  function bind(gate,project,books,reviews,projectId){
    const selected=()=>{const title=gate.querySelector('[data-book-review-select]')?.value||books[0].title;return {book:books.find(b=>b.title===title)||books[0],review:reviews.get(title)||null};};
    gate.querySelector('[data-book-review-select]')?.addEventListener('change',e=>{sessionStorage.setItem(`cc-book-review:${projectId}`,e.target.value);schedule(0);});
    gate.querySelector('[data-book-review-open]')?.addEventListener('click',()=>{const {review}=selected();if(review?.artifact_ref&&isOpenable(review.artifact_ref))window.open(review.artifact_ref,'_blank','noopener');});
    gate.querySelector('[data-book-review-prepare]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{book,review}=selected();e.currentTarget.disabled=true;msg.textContent='Preparing Agent review run…';try{await startAgent(project,book,review,'prepare');msg.textContent='Agent queued. It will stop at PC REQUIRED when the exact final PDF is ready.';}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
    gate.querySelector('[data-book-review-approve]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{review}=selected();if(!review)return;e.currentTarget.disabled=true;msg.textContent='Locking approved final…';try{await rpc('command_center_book_review_approve',{p_review_id:review.id});msg.textContent='Approved Final. This book is locked and waiting in the publication queue.';schedule(100);}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
    gate.querySelectorAll('[data-book-review-changes-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const form=gate.querySelector('[data-book-review-changes-form]');form.hidden=!form.hidden;if(!form.hidden)form.querySelector('textarea')?.focus({preventScroll:true});}));
    gate.querySelector('[data-book-review-changes-form]')?.addEventListener('submit',async e=>{e.preventDefault();const msg=gate.querySelector('[data-book-review-message]'),feedback=e.currentTarget.querySelector('textarea')?.value.trim()||'',{book,review}=selected();if(!review||!feedback){msg.textContent='Describe exactly what needs changed first.';return;}const btn=e.currentTarget.querySelector('button');btn.disabled=true;msg.textContent='Saving your changes…';try{await rpc('command_center_book_review_needs_changes',{p_review_id:review.id,p_feedback:feedback});try{await startAgent(project,book,review,'correct',feedback);msg.textContent='Changes saved and correction run queued.';}catch(agentErr){msg.textContent=`Changes saved. ${agentErr.message||String(agentErr)}`;}schedule(150);}catch(err){msg.textContent=err.message||String(err);btn.disabled=false;}});
    gate.querySelector('[data-book-review-correct]')?.addEventListener('click',async e=>{const msg=gate.querySelector('[data-book-review-message]'),{book,review}=selected();e.currentTarget.disabled=true;msg.textContent='Starting correction run…';try{await startAgent(project,book,review,'correct',review?.feedback||'Apply the recorded owner review changes.');msg.textContent='Correction run queued.';}catch(err){msg.textContent=err.message||String(err);e.currentTarget.disabled=false;}});
    gate.querySelectorAll('[data-book-publish-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const form=gate.querySelector('[data-book-publish-form]');if(form)form.hidden=!form.hidden;}));
    gate.querySelector('[data-book-publish-form]')?.addEventListener('submit',async e=>{e.preventDefault();const msg=gate.querySelector('[data-book-review-message]'),booksSelected=[...e.currentTarget.querySelectorAll('input[name="book"]:checked')].map(x=>x.value),formats=[...e.currentTarget.querySelectorAll('input[name="format"]:checked')].map(x=>x.value);if(!booksSelected.length||!formats.length){msg.textContent='Choose at least one approved book and one published format.';return;}const btn=e.currentTarget.querySelector('button');btn.disabled=true;msg.textContent='Recording published status…';try{await rpc('command_center_book_mark_published',{p_project_id:projectId,p_book_titles:booksSelected,p_formats:formats});msg.textContent='Published status recorded. Finished books stay locked unless you deliberately reopen them.';schedule(120);}catch(err){msg.textContent=err.message||String(err);btn.disabled=false;}});
    gate.querySelector('[data-book-review-reopen-legacy]')?.addEventListener('click',()=>{const form=gate.querySelector('[data-book-review-legacy-form]');form.hidden=!form.hidden;if(!form.hidden)form.querySelector('textarea')?.focus({preventScroll:true});});
    gate.querySelector('[data-book-review-legacy-form]')?.addEventListener('submit',async e=>{e.preventDefault();const msg=gate.querySelector('[data-book-review-message]'),feedback=e.currentTarget.querySelector('textarea')?.value.trim()||'',{book}=selected();if(!feedback){msg.textContent='Describe exactly what needs changed first.';return;}const btn=e.currentTarget.querySelector('button');btn.disabled=true;msg.textContent='Reopening book…';try{await startAgent(project,book,null,'correct',feedback);msg.textContent='Book reopened and correction run queued. The corrected PDF must come back through owner review before it can be locked again.';}catch(err){msg.textContent=err.message||String(err);btn.disabled=false;}});
  }

  async function mount(){
    if(busy)return;busy=true;
    try{
      const host=document.getElementById('ccApprovedApp'),anchor=document.getElementById('ccApprovedAgentMount'),projectId=currentProjectId();
      if(!host||!anchor||!projectId){document.getElementById('ccBookReviewGate')?.remove();lastProjectId=null;return;}
      const c=client(),u=await auth();if(!c||!u)return;
      const [p,k,r,pub]=await Promise.all([c.from('projects').select('id,name,category').eq('id',projectId).maybeSingle(),c.from('analytics_project_kpis').select('metric_key,value_text').eq('project_id',projectId).eq('verified',true),c.from('book_owner_reviews').select('*').eq('project_id',projectId).order('revision',{ascending:false}),c.from('book_publication_states').select('*').eq('project_id',projectId)]);
      if(p.error||k.error||r.error||pub.error||!p.data)return;
      const books=bookRows(k.data);if(!books.length){document.getElementById('ccBookReviewGate')?.remove();lastProjectId=projectId;return;}
      const reviews=latestByBook(r.data),pubs=publicationMap(pub.data);applyPublicationTiles(host,books,pubs);
      const wrap=document.createElement('div');wrap.innerHTML=cardHtml(p.data,books,reviews,pubs);const fresh=wrap.firstElementChild;const old=document.getElementById('ccBookReviewGate');if(old)old.replaceWith(fresh);else anchor.insertAdjacentElement('beforebegin',fresh);bind(fresh,p.data,books,reviews,projectId);lastProjectId=projectId;
    }finally{busy=false;}
  }

  function schedule(ms=120){clearTimeout(timer);timer=setTimeout(mount,ms);}
  document.addEventListener('click',event=>{if(event.target.closest?.('[data-cc-project],[data-cc-back],[data-cc-home]'))schedule(220);},true);
  window.addEventListener('popstate',()=>schedule(100));
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(100);});
  window.addEventListener('command-center:book-review-refresh',()=>schedule(0));
  window.addEventListener('command-center:client-ready',()=>schedule(180));
  setInterval(()=>{const id=currentProjectId();if(!document.hidden&&id&&id===lastProjectId)schedule(0);},30000);
  setTimeout(()=>schedule(0),900);

  api.refresh=()=>schedule(0);
})();