(() => {
  let bound=false;
  function client(){return window.COMMAND_CENTER_SUPABASE||null;}
  function enforceLocalSignout(){
    const button=document.getElementById('signOutBtn');
    const c=client();
    if(!button||!c)return;
    button.onclick=()=>c.auth.signOut({scope:'local'});
    button.dataset.ccSecurityLocalSignout='1';
  }
  function bind(){
    const c=client();
    if(!c||bound)return false;
    bound=true;
    c.auth.onAuthStateChange((event)=>{
      enforceLocalSignout();
      if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED','MFA_CHALLENGE_VERIFIED'].includes(event))setTimeout(()=>window.COMMAND_CENTER_SECURITY?.checkMfaGate?.(),0);
      if(event==='SIGNED_OUT')document.getElementById('securityMfaGate')?.remove();
    });
    enforceLocalSignout();
    setTimeout(()=>window.COMMAND_CENTER_SECURITY?.checkMfaGate?.(),0);
    return true;
  }
  const timer=setInterval(()=>{if(bind())clearInterval(timer);},100);
  window.addEventListener('load',()=>{bind();enforceLocalSignout();window.COMMAND_CENTER_SECURITY?.checkMfaGate?.();},{once:true});
})();
