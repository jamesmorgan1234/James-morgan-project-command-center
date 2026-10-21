(() => {
  let applying=false;
  let framePending=false;
  const cashSvg='<svg viewBox="0 0 96 64" fill="none" stroke="currentColor" stroke-width="3"><rect x="8" y="10" width="64" height="38" rx="5"/><circle cx="40" cy="29" r="9"/><path d="M15 18h7M58 40h7M75 30c8 0 13 5 13 11s-5 11-13 11c-4 0-8-1-11-3M77 23v36"/></svg>';

  function normalizeMoney(raw){
    const text=String(raw||'').trim();
    if(/not yet integrated|source not available|^\$0\.00\s+tracked$/i.test(text)) return null;
    const match=text.match(/(?:Total\s*)?\$([\d,]+(?:\.\d{1,2})?)/i);
    if(!match) return null;
    const amount=Number(match[1].replaceAll(',',''));
    if(!Number.isFinite(amount)) return null;
    return new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
  }

  function setTextIfChanged(node,next){
    if(node.textContent!==next) node.textContent=next;
  }

  function decorate(){
    framePending=false;
    if(applying) return;
    const card=document.querySelector('.stat-button[data-view="earning"]');
    if(!card) return;
    applying=true;
    try{
      const value=card.querySelector('.value');
      const label=card.querySelector('.label');
      const sub=card.querySelector('.stat-sub');
      if(!value||!label||!sub) return;

      const originalCount=card.dataset.ccEarningCount || value.textContent.trim() || '0';
      if(!card.dataset.ccEarningCount) card.dataset.ccEarningCount=originalCount;

      const sourceText=sub.dataset.ccEarningSource || sub.textContent.trim();
      if(!sub.dataset.ccEarningSource) sub.dataset.ccEarningSource=sourceText;

      const money=normalizeMoney(sourceText);
      const nextValue=money || 'N/A';
      const nextSub=money
        ? `${originalCount} project${originalCount==='1'?'':'s'} earning verified revenue`
        : 'Revenue source not available yet';

      setTextIfChanged(label,'Project Earnings');
      setTextIfChanged(value,nextValue);
      setTextIfChanged(sub,nextSub);

      if(!card.querySelector('.cc-earnings-cash-mark')){
        const mark=document.createElement('span');
        mark.className='cc-earnings-cash-mark';
        mark.setAttribute('aria-hidden','true');
        mark.innerHTML=cashSvg;
        card.appendChild(mark);
      }
    } finally {
      applying=false;
    }
  }

  function scheduleDecorate(){
    if(framePending) return;
    framePending=true;
    requestAnimationFrame(decorate);
  }

  const stats=document.getElementById('stats');
  if(stats) new MutationObserver(scheduleDecorate).observe(stats,{childList:true,subtree:true,characterData:true});
  window.addEventListener('load',()=>{decorate();setTimeout(decorate,250);setTimeout(decorate,900);},{once:true});
  decorate();
})();
