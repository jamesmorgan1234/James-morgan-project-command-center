const LOAD_TIMEOUT_MS=6000;

function withTimeout(promise,label){
  let timer;
  const timeout=new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error(`${label} timed out after ${LOAD_TIMEOUT_MS}ms`)),LOAD_TIMEOUT_MS);
  });
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}

async function loadClientModule(){
  const failures=[];
  try{
    return await withTimeout(import('https://esm.sh/@supabase/supabase-js@2.118.0?bundle'),'Primary Supabase client provider');
  }catch(error){
    failures.push(error);
  }
  try{
    return await withTimeout(import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm?cc7-fallback=1'),'Fallback Supabase client provider');
  }catch(error){
    failures.push(error);
  }
  const detail=failures.map(error=>error?.message||String(error)).join(' | ');
  throw new Error(`Command Center could not load its Supabase client. ${detail}`);
}

const supabaseModule=await loadClientModule();
if(typeof supabaseModule?.createClient!=='function')throw new Error('Supabase client module loaded without createClient.');

export const createClient=supabaseModule.createClient;
