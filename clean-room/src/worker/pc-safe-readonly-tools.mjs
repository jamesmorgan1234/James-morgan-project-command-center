/**
 * COMMAND CENTER free-read-only local adapters.
 * Syntax compile is never executed. Public docs reads are fixed-host HTTPS GET,
 * checked against public IPv4 DNS with redirects blocked, no cookies or auth.
 */
import {Script} from 'node:vm';
import {request as httpsRequest} from 'node:https';
import {lookup as dnsLookup} from 'node:dns/promises';
import {createHash} from 'node:crypto';

const ensure=(ok,code)=>{if(!ok)throw Error(code)};
const DOC_HOST_PATHS=Object.freeze({
  'developer.mozilla.org':'/en-US/docs/',
  'nodejs.org':'/api/',
  'docs.python.org':'/3/',
  'www.w3.org':'/TR/',
  'www.rfc-editor.org':'/rfc/'
});
export function canonicalPublicDocsUrl(value){
 ensure(typeof value==='string'&&value.length<700,'docs_url_invalid');
 let u;try{u=new URL(value)}catch{throw Error('docs_url_invalid')}
 ensure(u.protocol==='https:'&&u.port===''&&u.username===''&&u.password===''&&u.search===''&&u.hash==='' &&
   Object.hasOwn(DOC_HOST_PATHS,u.hostname)&&u.pathname.startsWith(DOC_HOST_PATHS[u.hostname]) &&
   !u.pathname.includes('..')&&u.pathname.length<=600,'docs_scope_denied');
 return u;
}
export function publicIpv4(value){
 if(typeof value!=='string'||!/^\d{1,3}(\.\d{1,3}){3}$/.test(value))return false;
 const p=value.split('.').map(Number);if(p.some(n=>n<0||n>255))return false;
 const [a,b,c]=p;
 if(a===0||a===10||a===127||a>=224||a===169&&b===254||
    a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||
    a===192&&b===0||a===192&&b===88&&c===99||
    a===192&&b===0&&c===2||a===198&&b>=18&&b<=19||
    a===198&&b===51&&c===100||a===203&&b===0&&c===113||
    a===255)return false;
 return true;
}
export async function readAllowedPublicDocs(rawUrl,{dns=dnsLookup,https=httpsRequest}={}){
 const url=canonicalPublicDocsUrl(rawUrl);
 const addresses=await dns(url.hostname,{family:4,all:true,verbatim:true});
 ensure(Array.isArray(addresses)&&addresses.length>0&&addresses.every(r=>r.family===4&&publicIpv4(r.address)),'docs_public_dns_required');
 const address=addresses[0].address;
 return new Promise((resolve,reject)=>{
   let done=false,bytes=0;
   const stop=(err)=>{if(!done){done=true;reject(err instanceof Error?err:Error('docs_fetch_error'))}};
   const req=https({
    protocol:'https:',hostname:url.hostname,servername:url.hostname,method:'GET',port:443,
    path:url.pathname,timeout:8500,
    lookup:(host,options,callback)=>callback(null,address,4),
    headers:{accept:'text/plain,text/html','user-agent':'CommandCenter-FreeReadonlyDocs/1.0','cache-control':'no-store'},
    agent:false
   },res=>{
    if(res.statusCode!==200){res.destroy();return stop(Error('docs_http_not_200'))}
    const ct=String(res.headers['content-type']??'').toLowerCase();
    if(!ct.includes('text/html')&&!ct.includes('text/plain')){res.destroy();return stop(Error('docs_not_text'))}
    const chunks=[];
    res.on('data',chunk=>{
      bytes+=chunk.length;
      if(bytes>65536){res.destroy();stop(Error('docs_body_limit'))}
      else chunks.push(chunk);
    });
    res.on('end',()=>{
      if(done)return;
      done=true;
      resolve(Object.freeze({url:url.href,status:200,contentType:ct.slice(0,80),
         bytes,sha256:createHash('sha256').update(Buffer.concat(chunks)).digest('hex'),
         excerpt:Buffer.concat(chunks).toString('utf8').slice(0,45000),
         untrustedPublicContent:true,executedCompanyWork:false}));
    });
    res.on('error',stop);
   });
   req.on('timeout',()=>req.destroy(Error('docs_timeout')));
   req.on('error',stop);
   req.end();
 });
}
export async function executePcSafeReadOnly(actionKey,inputText,{readDocs=readAllowedPublicDocs}={}){
 ensure(typeof inputText==='string'&&Buffer.byteLength(inputText,'utf8')<=16000,'safe_input_invalid');
 let input;try{input=JSON.parse(inputText)}catch{throw Error('safe_input_invalid')}
 ensure(input&&typeof input==='object'&&!Array.isArray(input),'safe_input_invalid');
 if(actionKey==='code.js_syntax_check'){
   ensure(Object.keys(input).length===1&&typeof input.source==='string'&&input.source.length<=12000,'source_scope_invalid');
   let valid=true,errorCode=null;
   try{new Script(input.source,{filename:'untrusted-owner-code.js',displayErrors:false})}
   catch(e){valid=false;errorCode=e instanceof SyntaxError?'javascript_syntax_error':'javascript_parse_error'}
   return JSON.stringify({tool:'code.js_syntax_check',syntaxValid:valid,errorCode,
      sourceHash:createHash('sha256').update(input.source).digest('hex'),executed:false,paidUsageAuthorized:false});
 }
 if(actionKey==='research.public_docs_read'){
   ensure(Object.keys(input).length===1&&typeof input.url==='string','docs_input_scope_invalid');
   const result=await readDocs(input.url);
   ensure(result?.url===canonicalPublicDocsUrl(input.url).href&&result?.untrustedPublicContent===true &&
     result?.executedCompanyWork===false&&result?.status===200&&typeof result?.excerpt==='string','docs_receipt_invalid');
   return JSON.stringify({tool:'research.public_docs_read',...result,executed:false,paidUsageAuthorized:false});
 }
 throw Error('unapproved_safe_tool');
}
