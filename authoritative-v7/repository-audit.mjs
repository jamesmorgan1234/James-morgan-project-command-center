import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';

const root=process.cwd();
const outDir=join(root,'audit-output');
const norm=p=>p.split('\\').join('/');

const authoritativeRequirementFiles=new Set([
  'COMMAND_CENTER_APPROVED_VISUAL_SPEC.md',
  'COMMAND_CENTER_CLEAN_REBUILD_STANDARD.md',
  'COMMAND_CENTER_PRODUCT_ROADMAP.md'
]);

async function walk(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const out=[];
  for(const entry of entries){
    if(entry.name==='.git'||entry.name==='audit-output'||entry.name==='node_modules')continue;
    const full=join(dir,entry.name);
    if(entry.isDirectory())out.push(...await walk(full));
    else if(entry.isFile())out.push(full);
  }
  return out;
}

function classify(path){
  const lower=path.toLowerCase(),ext=extname(lower),name=basename(lower);
  if(path.startsWith('authoritative-v7/')){
    if(name==='repository-audit.mjs'||name==='qa.test.mjs')return'ACTIVE_V7_QA';
    if(ext==='.md')return'ACTIVE_V7_DOCUMENTATION';
    if(['.js','.css','.html','.webmanifest'].includes(ext))return'ACTIVE_V7_RUNTIME';
    return'ACTIVE_V7_SUPPORT';
  }
  if(path==='.github/workflows/cc7-clean-room-qa.yml')return'ACTIVE_V7_QA_WORKFLOW';
  if(/^command-center-approved-icon-(192|256|512)\.png$/i.test(path))return'PROTECTED_APPROVED_ASSET';
  if(authoritativeRequirementFiles.has(path))return'AUTHORITATIVE_V7_REQUIREMENT';
  if(/STANDARD\.md$|OPERATING_MODEL\.md$|GLOBAL_CHECKPOINT_RULE\.txt$|ROADMAP.*\.md$|PIPELINE\.md$|FIX_NOTE\.md$|UPDATE_NOTES\.md$/i.test(path))return'LEGACY_REQUIREMENT_UNTRUSTED';
  if(path.startsWith('.github/workflows/'))return'LEGACY_WORKFLOW_REFERENCE';
  if(path.startsWith('tests/'))return'LEGACY_TEST_REFERENCE';
  if(path.startsWith('supabase/migrations/'))return'LEGACY_DATABASE_HISTORY';
  if(path.startsWith('supabase/functions/'))return'LEGACY_FUNCTION_REFERENCE';
  if(['.js','.css','.html'].includes(ext))return'LEGACY_RUNTIME_REFERENCE';
  if(['.png','.jpg','.jpeg','.webp','.svg','.ico'].includes(ext))return'LEGACY_VISUAL_ASSET_REFERENCE';
  if(['.md','.txt','.json','.webmanifest','.yml','.yaml'].includes(ext))return'PROJECT_REFERENCE_UNTRUSTED';
  return'PROJECT_REFERENCE_OTHER';
}

const files=(await walk(root)).sort();
const rows=[];
for(const full of files){
  const rel=norm(relative(root,full));
  const data=await readFile(full);
  rows.push({path:rel,classification:classify(rel),bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
}

const counts={};
for(const row of rows)counts[row.classification]=(counts[row.classification]||0)+1;

const activeLegacyDeps=[];
const activeTextRows=rows.filter(r=>r.classification.startsWith('ACTIVE_V7_')&&/\.(js|html|css|webmanifest)$/.test(r.path));
const legacyNeedles=[
  'command-center-v4','command-center-v5','command-center-v6',
  'command-center-approved-ui','command-center-approved-nav',
  'startup-loader.js','../app.js','../styles.css',
  'command_center_agent_service_','agent_sessions','agent_steps','agent_runner_controls'
];
for(const row of activeTextRows){
  const text=await readFile(join(root,row.path),'utf8');
  for(const needle of legacyNeedles)if(text.includes(needle))activeLegacyDeps.push({path:row.path,needle});
}

const authoritativeRequirementPaths=rows.filter(r=>r.classification==='AUTHORITATIVE_V7_REQUIREMENT').map(r=>r.path).sort();
const requiredAuthorities=[...authoritativeRequirementFiles].sort();
const authorityMismatch=JSON.stringify(authoritativeRequirementPaths)!==JSON.stringify(requiredAuthorities);

const report={
  generated_at:new Date().toISOString(),
  total_files:rows.length,
  classification_counts:counts,
  authoritative_v7_requirements:authoritativeRequirementPaths,
  authority_mismatch:authorityMismatch,
  active_legacy_dependency_findings:activeLegacyDeps,
  files:rows
};

await mkdir(outDir,{recursive:true});
await writeFile(join(outDir,'cc7-repository-audit.json'),JSON.stringify(report,null,2));
const md=[
  '# Command Center V7 Repository Audit','',
  `Generated: ${report.generated_at}`,
  `Total files: ${rows.length}`,'',
  '## Authoritative V7 requirement files','',
  ...authoritativeRequirementPaths.map(path=>`- ${path}`),
  '',
  `Authority-set mismatch: ${authorityMismatch?'YES':'NO'}`,'',
  '## Classification totals','',
  ...Object.entries(counts).sort().map(([k,v])=>`- ${k}: ${v}`),'',
  `## Active V7 legacy dependency findings: ${activeLegacyDeps.length}`,'',
  ...(activeLegacyDeps.length?activeLegacyDeps.map(x=>`- ${x.path}: ${x.needle}`):['- None']),
  '',
  '## Every-file manifest','',
  '| Path | Classification | Bytes | SHA-256 |',
  '|---|---|---:|---|',
  ...rows.map(r=>`| ${r.path.replaceAll('|','\\|')} | ${r.classification} | ${r.bytes} | ${r.sha256} |`)
];
await writeFile(join(outDir,'cc7-repository-audit.md'),md.join('\n'));
console.log(JSON.stringify({
  total_files:rows.length,
  classification_counts:counts,
  authoritative_v7_requirements:authoritativeRequirementPaths,
  authority_mismatch:authorityMismatch,
  active_legacy_dependency_findings:activeLegacyDeps
},null,2));
if(activeLegacyDeps.length||authorityMismatch)process.exitCode=2;
