/**
 * Local immutable tool-invocation journal. Not a company permission store.
 * The root and canonical authorization/lease adapters come from trusted setup;
 * a model never chooses a directory, owner identity, or saved action.
 */
import {open,realpath,stat,lstat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
const digest=s=>createHash('sha256').update(s).digest('hex');
const canonical=value=>{
 if(value===null||typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
};
const ensure=(ok,code)=>{if(!ok)throw Error(code)};

export async function createPcToolJournal({root,createLease,assertCurrent}){
 ensure(typeof createLease==='function'&&typeof assertCurrent==='function','canonical_lease_adapters_required');
 const directory=await realpath(root);
 ensure(directory===resolve(root)&&(await stat(directory)).isDirectory(),'journal_requires_canonical_trusted_directory');
 const pathFor=(id,suffix)=>join(directory,digest(id)+suffix);
 const sameRoot=async()=>ensure(await realpath(root)===directory,'journal_directory_changed');
 async function load(path){
  await sameRoot();const before=await lstat(path);ensure(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1,'journal_record_invalid');
  const f=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const s=await f.stat();ensure(s.isFile()&&s.nlink===1&&s.size<=2500000&&s.ino===before.ino&&s.dev===before.dev,'journal_record_invalid');const value=JSON.parse(await f.readFile('utf8'));await sameRoot();return value}finally{await f.close()}
 }
 async function save(path,value){
  const encoded=JSON.stringify(value);ensure(Buffer.byteLength(encoded,'utf8')<=2500000,'journal_record_too_large');
  await sameRoot();const f=await open(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
  try{await f.writeFile(encoded);await f.sync()}finally{await f.close()}
  // Persist the directory entry on runtimes that support syncing directories.
  // Windows refuses directory handles; file.sync above is still mandatory.
  if(process.platform!=='win32'){const d=await open(directory,constants.O_RDONLY);try{await d.sync()}finally{await d.close()}}
 }
 const signature=saved=>digest(canonical(saved));
 return Object.freeze({
  async begin(saved,inputHash){
   ensure(digest(saved.inputText)===inputHash,'journal_input_hash_mismatch');
   const id=saved.invocationId,start=pathFor(id,'.start.json'),done=pathFor(id,'.result.json'),binding=signature(saved);
   try{
    const record=await load(start);
    ensure(record.binding===binding&&record.inputHash===inputHash,'journal_saved_command_mismatch');
    try{const result=await load(done);ensure(canonical(result.lease)===canonical(record.lease),'journal_lease_changed');return{state:'completed',result}}
    catch(e){if(e.code==='ENOENT')return{state:'uncertain'};throw e}
   }catch(e){if(e.code!=='ENOENT')throw e}
   const lease=await createLease(structuredClone(saved));
   await assertCurrent(structuredClone(lease));
   try{await save(start,{binding,inputHash,lease})}
   catch(e){if(e.code==='EEXIST')return{state:'uncertain'};throw e}
   return{state:'fresh',lease};
  },
  async commit(result){
   const record=await load(pathFor(result.lease.invocationId,'.start.json'));
   ensure(canonical(record.lease)===canonical(result.lease)&&record.inputHash===result.inputHash,'journal_lease_changed');
   ensure(digest(result.outputText)===result.outputHash,'journal_output_hash_mismatch');
   await assertCurrent(structuredClone(result.lease));
   await save(pathFor(result.lease.invocationId,'.result.json'),result);
  },
  async readBack(id){
   const record=await load(pathFor(id,'.start.json')),result=await load(pathFor(id,'.result.json'));
   ensure(canonical(record.lease)===canonical(result.lease)&&result.lease.invocationId===id&&record.inputHash===result.inputHash&&digest(result.outputText)===result.outputHash,'journal_readback_mismatch');
   return result;
  }
 });
}
