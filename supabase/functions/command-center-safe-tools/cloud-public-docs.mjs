// COMMAND CENTER owner-requested cloud public documentation fetcher.
// $0 existing Supabase Edge only; NO general browser, cookies, company tasks,
// plugins, credentials, arbitrary domains, redirects, scripts, or paid fallback.
const HOST_ROOTS=Object.freeze({
 'developer.mozilla.org':'/en-US/docs/',
 'nodejs.org':'/api/',
 'docs.python.org':'/3/',
 'www.w3.org':'/TR/',
 'www.rfc-editor.org':'/rfc/'
});
const fail=code=>{throw Error(code)};
export function checkedCloudDocUrl(raw){
 if(typeof raw!=='string'||raw.length>700||raw.length<16)fail('docs_url_invalid');
 let u;try{u=new URL(raw)}catch{fail('docs_url_invalid')}
 if(u.protocol!=='https:'||u.port!==''||u.username!==''||u.password!==''||
   u.search!==''||u.hash!==''||!Object.hasOwn(HOST_ROOTS,u.hostname)||
   !u.pathname.startsWith(HOST_ROOTS[u.hostname])||u.pathname.length>600||
   u.pathname.includes('..')||u.href!==raw)fail('docs_scope_denied');
 return u;
}
export function canonicalCloudReceiptJson(value){
 if(Array.isArray(value))return '['+value.map(canonicalCloudReceiptJson).join(',')+']';
 if(value!==null&&typeof value==='object')
   return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+
      canonicalCloudReceiptJson(value[key])).join(',')+'}';
 return JSON.stringify(value);
}
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export async function digestPublicDocs(value){
 const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
 return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
}
export async function boundedCloudPublicDocs(raw,{
 fetcher=fetch,timeoutMs=8500,maxBytes=65536
}={}){
 const url=checkedCloudDocUrl(raw);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>8500||
    !Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>65536)
    fail('docs_cloud_configuration_invalid');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetcher(url.href,{
    method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',
    signal:controller.signal,headers:{accept:'text/plain,text/html'}
  });
  if(response.status>=300&&response.status<400)fail('docs_redirect_denied');
  if(response.status!==200)fail('docs_http_not_200');
  if(response.url&&response.url!==url.href)fail('docs_redirect_denied');
  const contentType=String(response.headers?.get('content-type')??'').toLowerCase();
  if(!contentType.includes('text/plain')&&!contentType.includes('text/html'))
    fail('docs_text_required');
  if(!response.body?.getReader)fail('docs_body_missing');
  const reader=response.body.getReader(),chunks=[];
  let length=0;
  try{
    while(true){
      const part=await reader.read();
      if(part.done)break;
      if(!(part.value instanceof Uint8Array))fail('docs_body_invalid');
      length+=part.value.byteLength;
      if(length>maxBytes)fail('docs_body_limit');
      chunks.push(part.value);
    }
  }finally{try{await reader.cancel()}catch{}}
  const body=new Uint8Array(length);
  let offset=0;for(const part of chunks){body.set(part,offset);offset+=part.byteLength}
  return Object.freeze({
    tool:'research.public_docs_read',source:'existing_supabase_cloud_read_only',
    url:url.href,readSucceeded:true,status:200,contentType:contentType.slice(0,80),
    bytes:length,sha256:await digestPublicDocs(body),
    excerpt:new TextDecoder('utf-8').decode(body).slice(0,45000),
    untrustedPublicContent:true,executed:false,executedCompanyWork:false,
    companyBuildStarted:false,generalCompanyExecution:false,paidUsageAuthorized:false
  });
 }catch(e){
  const known=['docs_redirect_denied','docs_http_not_200','docs_text_required',
    'docs_body_missing','docs_body_invalid','docs_body_limit'];
  const errorCode=controller.signal.aborted?'docs_cloud_timeout':
     (known.includes(e?.message)?e.message:'docs_cloud_unavailable');
  return Object.freeze({
    tool:'research.public_docs_read',source:'existing_supabase_cloud_read_only',
    url:url.href,readSucceeded:false,errorCode,untrustedPublicContent:true,
    executed:false,executedCompanyWork:false,companyBuildStarted:false,
    generalCompanyExecution:false,paidUsageAuthorized:false
  });
 }finally{clearTimeout(timer)}
}
