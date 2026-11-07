/** Separate outbound, worker-authenticated COMMAND CENTER activation-only lane. */
const CC='https://gmlsucpwliegwlxymjvp.supabase.co';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
export function createPcActivationExchangeTransport({workerToken,fetcher=fetch}){
  ensure(/^ccpc_[a-f0-9]{64}$/.test(workerToken??''),'paired_worker_token_required');
  ensure(typeof fetcher==='function','activation_fetcher_required');
  const active=new Map();
  async function post(action,payload){
    const response=await fetcher(CC+'/functions/v1/command-center-pc-worker/activation-exchange-'+action,{
      method:'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000),
      headers:{'content-type':'application/json','x-command-center-worker-token':workerToken},
      body:JSON.stringify({...payload,clientContract:'cc-pc-activation-exchange-v1',
        allowPaid:false,allowProtected:false,executionAuthorized:false,companyBuildAuthorized:false})});
    ensure(response?.ok,'activation_exchange_transport_failed');
    const result=await response.json();ensure(result&&Object.hasOwn(result,'result'),'activation_exchange_receipt_invalid');
    return result.result;
  }
  const cached=id=>{const c=active.get(id);ensure(c,'activation_exchange_not_claimed');return c};
  const fence=l=>({exchangeId:l.exchangeId,fencingToken:l.fencingToken});
  return Object.freeze({
    async next(){
      ensure(active.size===0,'one_activation_exchange_at_a_time');
      const claim=await post('next',{});
      if(claim===null)return null;
      ensure(UUID.test(claim?.saved?.exchangeId??'')&&claim?.lease?.exchangeId===claim.saved.exchangeId,
        'activation_exchange_claim_invalid');
      active.set(claim.saved.exchangeId,structuredClone(claim));return structuredClone(claim);
    },
    async assertCurrent(l){
      ensure(JSON.stringify(cached(l.exchangeId).lease)===JSON.stringify(l),'activation_exchange_fence_changed');
      ensure((await post('current',fence(l)))?.current===true,'activation_exchange_no_longer_current');
    },
    async commit(l,result){
      ensure(JSON.stringify(cached(l.exchangeId).lease)===JSON.stringify(l),'activation_exchange_fence_changed');
      return post('commit',{...fence(l),result});
    },
    async readback(l){
      ensure(JSON.stringify(cached(l.exchangeId).lease)===JSON.stringify(l),'activation_exchange_fence_changed');
      const result=await post('readback',fence(l));
      ensure(result?.receipt,'activation_exchange_canonical_receipt_missing');
      return result.receipt;
    },
    abandon(id){active.delete(id)}
  });
}
