/** Immutable project artifacts, bound to one trusted owner/company/workspace. */
import {open,realpath,stat,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const ensure=(ok,code)=>{if(!ok)throw Error(code)};
export async function createPcProjectArtifactHandlers({root,ownerId,projectId,companyId,accountRef,toolKey,versionRef}){
 ensure([root,ownerId,projectId,companyId,accountRef,toolKey,versionRef].every(s=>typeof s==='string'&&s.trim()),'artifact_workspace_binding_required');
 const directory=await realpath(root);
 ensure(directory===resolve(root)&&(await stat(directory)).isDirectory(),'artifact_requires_canonical_trusted_directory');
 const checked=async({inputText,action,signal},actionKey,effect)=>{
  signal.throwIfAborted();
  ensure(action.ownerId===ownerId&&action.projectId===projectId&&action.companyId===companyId&&action.accountRef===accountRef&&
   action.toolKey===toolKey&&action.actionKey===actionKey&&action.effect===effect&&
   action.resourceProjectId===projectId&&action.resourceCompanyId===companyId,'artifact_exact_scope_required');
  ensure(await realpath(root)===directory,'artifact_directory_changed');
  let input;try{input=JSON.parse(inputText)}catch{throw Error('artifact_input_invalid')}
  ensure(input&&typeof input==='object'&&!Array.isArray(input)&&typeof input.name==='string'&&/^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(input.name)&&
   !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(input.name)&&!input.name.endsWith('.'),'artifact_name_invalid');
  ensure(Object.keys(input).every(k=>['name','content'].includes(k)),'artifact_input_invalid');
  return{input,path:join(directory,input.name)};
 };
 async function read(path,signal){
  signal.throwIfAborted();const before=await lstat(path);ensure(before.isFile()&&!before.isSymbolicLink()&&before.nlink===1,'artifact_file_invalid');
  const f=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{const s=await f.stat();ensure(s.isFile()&&s.nlink===1&&s.size<=100000&&s.ino===before.ino&&s.dev===before.dev,'artifact_file_invalid');const text=await f.readFile({encoding:'utf8',signal});signal.throwIfAborted();ensure(await realpath(root)===directory,'artifact_directory_changed');return text}finally{await f.close()}
 }
 return Object.freeze([
  Object.freeze({toolKey,actionKey:'artifact.write',versionRef,async invoke(args){
   const {input,path}=await checked(args,'artifact.write','local_write');
   ensure(typeof input.content==='string'&&Buffer.byteLength(input.content,'utf8')<=100000,'artifact_content_invalid');
   args.signal.throwIfAborted();const f=await open(path,constants.O_CREAT|constants.O_EXCL|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
   try{await f.writeFile(input.content,{encoding:'utf8',signal:args.signal});await f.sync()}finally{await f.close()}
   ensure(await realpath(root)===directory,'artifact_directory_changed');
   const actual=await read(path,args.signal);ensure(actual===input.content,'artifact_write_readback_mismatch');
   return JSON.stringify({name:input.name,bytes:Buffer.byteLength(actual,'utf8'),sha256:createHash('sha256').update(actual).digest('hex'),scope:'project_artifact_only'});
  }}),
  Object.freeze({toolKey,actionKey:'artifact.read',versionRef,async invoke(args){
   const {input,path}=await checked(args,'artifact.read','private_read');
   ensure(input.content===undefined,'artifact_read_input_invalid');
   return read(path,args.signal);
  }})
 ]);
}
