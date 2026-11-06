import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const script=readFileSync(new URL('../scripts/pc-worker-update/UPDATE_EXISTING_WORKER.ps1',import.meta.url),'utf8');
const command=readFileSync(new URL('../scripts/pc-worker-update/UPDATE_EXISTING_WORKER.cmd',import.meta.url),'utf8');
test('worker update archive contains exactly the scoped source payload, helper and hashes, with no owner secrets',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cc-pc-update-'));
 try{
  const output=join(dir,'worker.zip');
  const built=JSON.parse(execFileSync('python',['scripts/pc-worker-update/build-package.py',output,'--allow-working-tree'],{encoding:'utf8'}));
  assert.equal(built.files,11);
  const inspected=JSON.parse(execFileSync('python',['-c',`import zipfile,json,hashlib,sys
with zipfile.ZipFile(sys.argv[1]) as z:
 m=json.loads(z.read('UPDATE_MANIFEST.json')); names=z.namelist()
 assert z.testzip() is None
 for f in m['files']: assert hashlib.sha256(z.read('payload/'+f['path'])).hexdigest()==f['sha256']
 assert len(names)==len(set(names))==11
 assert all(not x.startswith('/') and '..' not in x.split('/') for x in names)
 print(json.dumps({'names':names,'manifest':m}))`,output],{encoding:'utf8'}));
  assert.equal(inspected.manifest.workerId,'737f5e7c-3884-4c61-81ac-634bdfc4828f');
  assert.equal(inspected.manifest.files.length,7);assert.equal(inspected.manifest.originalFiles.length,7);
  assert.equal(inspected.manifest.spendingAuthorized,false);assert.equal(inspected.manifest.companyBuildAuthorized,false);
  assert.ok(inspected.names.every(n=>!/(dpapi|worker-id\.txt|token-digest|pairing_request|worker-events|node_modules)/i.test(n)));
  if(inspected.manifest.candidateState==='working-tree-unapproved'){
   const refused=spawnSync('python',['scripts/pc-worker-update/build-package.py',join(dir,'publish.zip')],{encoding:'utf8'});
   assert.notEqual(refused.status,0);assert.match(refused.stderr,/Commit and verify source/);
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('Windows updater preserves pairing and task definition, refuses stopped workers, and tests before touching runtime',()=>{
 assert.doesNotMatch(script+command,/ExecutionPolicy\s+Bypass|Set-ExecutionPolicy|Register-ScheduledTask|Unregister-ScheduledTask|Enable-ScheduledTask|Disable-ScheduledTask|ConvertTo-SecureString|worker-token\.dpapi|token-digest\.txt/);
 assert.ok(script.indexOf('$selfTest=& $node')<script.indexOf('Stop-ScheduledTask'));
 assert.match(script,/\$task.State -ne 'Running'/);assert.match(script,/\$task.Settings.Enabled -ne \$true/);
 assert.match(script,/Installed source differs from recovered original/);
 assert.match(script,/Export-ScheduledTask/);assert.match(script,/\$taskXml/);
 assert.match(script,/source-backup-/);assert.match(script,/foreach\(\$relative in \$changed\)/);
 assert.match(script,/fullBrainActivationClaimed=\$false/);assert.match(script,/companyBuildStarted=\$false/);
});
