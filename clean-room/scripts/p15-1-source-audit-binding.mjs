import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const QUALIFIED_BUILD_CONTROL_INPUTS=new Set([
 'clean-room/package.json',
 'clean-room/package-lock.json',
 'clean-room/tsconfig.json',
 'clean-room/tsconfig.build.json',
 '.github/workflows/spec-lock-v2-clean-room-qa.yml'
]);
export function isQualifiedSourceInput(path){return typeof path==='string'&&(/^clean-room\/(src|public|tests|scripts)\//.test(path)||path.startsWith('supabase/migrations/')||/^roadmap\/master-build-plan-owner-review\/(20_|22_|23_|24_|25_|Command_Center_Canonical_Owner_Additions_REV3\.json$)/.test(path)||QUALIFIED_BUILD_CONTROL_INPUTS.has(path));}
/** A matching SHA header does not prove an audit was made from committed CI source bytes. */
export function assertSourceAuditMatchesGit(audit,{repoRoot,sourceCommit}={}){
 if(!/^[a-f0-9]{40}$/.test(sourceCommit??'')||audit?.headSha!==sourceCommit||!Array.isArray(audit.files))throw Error('Source audit must name the exact independently observed CI commit');
 const entries=audit.files.filter(f=>isQualifiedSourceInput(f.path));
 if(!entries.length)throw Error('Source audit has no qualified inputs');
 const seen=new Set();for(const entry of entries){if(typeof entry.path!=='string'||/[\r\n\\]/.test(entry.path)||entry.path.split('/').some(p=>!p||p==='.'||p==='..')||seen.has(entry.path)||!/^[a-f0-9]{64}$/.test(entry.sha256??''))throw Error('Invalid or duplicate audited source input');seen.add(entry.path);}
 const required=execFileSync('git',['ls-tree','-r','--name-only',sourceCommit],{cwd:repoRoot}).toString().split('\n').filter(isQualifiedSourceInput);
 if(required.length!==seen.size||required.some(path=>!seen.has(path)))throw Error('Source audit omits or adds qualified committed inputs');
 const raw=execFileSync('git',['cat-file','--batch'],{cwd:repoRoot,input:entries.map(e=>sourceCommit+':'+e.path).join('\n')+'\n',maxBuffer:128*1024*1024});let offset=0;
 for(const entry of entries){const end=raw.indexOf(10,offset);if(end<0)throw Error('Incomplete source object response');const header=raw.subarray(offset,end).toString(),parts=header.split(' '),size=Number(parts[2]);if(parts[1]!=='blob'||!Number.isSafeInteger(size)||size<0)throw Error('Audited input is missing from source commit: '+entry.path);offset=end+1;const bytes=raw.subarray(offset,offset+size);if(bytes.length!==size)throw Error('Truncated source object');offset+=size+1;const digest=createHash('sha256').update(bytes).digest('hex');if(digest!==entry.sha256)throw Error('Audit bytes differ from committed CI source: '+entry.path);}
 return {sourceCommit,checkedFileCount:entries.length};
}
