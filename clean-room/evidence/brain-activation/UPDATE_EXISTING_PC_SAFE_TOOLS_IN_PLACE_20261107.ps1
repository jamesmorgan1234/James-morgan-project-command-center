# COMMAND CENTER - scoped $0 safe-tool extension for the EXISTING paired 16-source Windows worker.
# No ZIP, no new worker, no new Scheduled Task, no re-pairing, no account operations.
# Pinned repository revision 3c7726755894c0f454fc5a073539faac91de467d; never use a moving branch URL.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f'
$modelDigest='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0'
$commit='3c7726755894c0f454fc5a073539faac91de467d'
$taskName='COMMAND CENTER Owner PC Brain Worker'
$root=Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER'
$app=Join-Path $root 'app'
$stage=$null
$stopped=$false
$replacements=@()
$backup=@{}
$taskXml=$null
$cleanSuccess=$false
$original=@'
[{"path":"clean-room/src/worker/pc-worker-cli.mjs","sha256":"f6b718a8aabd6a82054baa23d6637aa722c8502422f9932cb45f6b656eaa3476"},{"path":"clean-room/src/worker/pc-worker-supervisor.mjs","sha256":"ca1765241151c005d5f444e8d20ad14942c8adc23e4e45ae407c6cc58d51a16d"},{"path":"clean-room/src/worker/pc-worker-transport.mjs","sha256":"572fd5f28efa9c65d59260de14a00faa0dec813f2beaa390b87827aff91758e0"},{"path":"clean-room/src/brain/pc-local-ollama.mjs","sha256":"4965b5ab518f72d18420236828f225f266831def62b3be180692c3c4ed7317dd"},{"path":"clean-room/src/brain/pc-owner-inference-worker.mjs","sha256":"eaff92020cae4a0e1155cbd20a8520de0818ce6e9d916478963a2c84721dae41"},{"path":"clean-room/src/brain/pc-brain-readiness.mjs","sha256":"9aedb4292e97c768643c886ac853d72cc6514381eb2c9ebf4f77e3aed859d6e6"},{"path":"clean-room/src/brain/pc-activation-contract.mjs","sha256":"674b9ef0f50b9898336785732218494e6aa538890d31a40989c46c1132202062"},{"path":"clean-room/src/worker/pc-artifact-job-runner.mjs","sha256":"0d75969d549d51e5403e7d6e3ca7e381bed455d8bdc373f474c9ab668fdcbf13"},{"path":"clean-room/src/worker/pc-activation-exchange-runner.mjs","sha256":"da9ce5eb85585c6e01be0cfcafdcd398f3d3e0bdbce76d37297f6e0c9f0c3893"},{"path":"clean-room/src/worker/pc-activation-exchange-transport.mjs","sha256":"7bdbb09dc9c5c02340b0eaca789825cafd8759db78facf5ffd58287ef3f0087f"},{"path":"clean-room/src/worker/pc-tool-job-transport.mjs","sha256":"272f18beaff201edf173e91726d459ce507f5f404da95e5f8477ac3c7842e673"},{"path":"clean-room/src/worker/pc-tool-execution-lane.mjs","sha256":"0bfa9aef34fefc0b9acbf0e6a3b067787556ce66f9addaa1debdfd6c8ad81fed"},{"path":"clean-room/src/worker/pc-tool-journal.mjs","sha256":"45431510115657c42d98a9d5dc4ccedcead00f20f279f8d24a3ac37784d82ec0"},{"path":"clean-room/src/worker/pc-project-file-tool.mjs","sha256":"1e17349eaddff1a416921ce78ec0d7f0e7065bcb2672ab2b377b0179d2a9956b"},{"path":"clean-room/src/brain/tool-runtime.mjs","sha256":"ae16b8defb2fc3a5c5f5a702dc137140d8f408916c371eb6ddafb50e2fec5f03"},{"path":"clean-room/src/brain/tool-access.mjs","sha256":"2f40b5d33c9a5bc466bbe588ff3eea67c6a3a055dceed17b5679d944d43bb7b4"}]
'@ | ConvertFrom-Json
$patch=@'
[{"path":"clean-room/src/worker/pc-worker-cli.mjs","sha256":"ab3d70e1097984529cf7e1dd9ea466011d555227290d7cf193082c52ce0607ac"},{"path":"clean-room/src/worker/pc-worker-supervisor.mjs","sha256":"7093c0d31fdb75aa7c92fe1b5cc2e7827e8edde6dc4a2cd3e510152f6416ce17"},{"path":"clean-room/src/worker/pc-safe-tool-runner.mjs","sha256":"83b290176252dd6b4665d146f9262403741cb6712a044c89e5791728a28d1f34"},{"path":"clean-room/src/worker/pc-safe-tool-transport.mjs","sha256":"3e63b6ef0a394aa8a7737e35c9f0f7c6030095f502c3beea0d55a4ec06f11474"},{"path":"clean-room/src/worker/pc-safe-readonly-tools.mjs","sha256":"f5d523e26746d61cd6eeffb8f337ebe5bd0ea9755ba6fa06e5044548645d4117"}]
'@ | ConvertFrom-Json
function Expected-Path([string]$base,[string]$relative) {
 if(-not (($original.path -ccontains $relative) -or ($patch.path -ccontains $relative))) {
   throw 'Source outside the exact approved 19-file boundary.'
 }
 if($relative -notmatch '^clean-room/(src/worker|src/brain)/[a-z0-9-]+\.mjs$') {
   throw 'Unexpected source location.'
 }
 $baseFull=[IO.Path]::GetFullPath($base)
 $full=[IO.Path]::GetFullPath((Join-Path $baseFull ($relative.Replace('/',[IO.Path]::DirectorySeparatorChar))))
 if(-not $full.StartsWith($baseFull+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {
   throw 'Path escapes the existing application.'
 }
 $walk=Split-Path $full
 while($walk -and $walk.Length -ge $baseFull.Length) {
   if(Test-Path -LiteralPath $walk) {
      if((Get-Item -LiteralPath $walk -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw 'Reparse point refused.'
      }
   }
   if([string]::Equals($walk,$baseFull,[StringComparison]::OrdinalIgnoreCase)){break}
   $parent=Split-Path $walk
   if([string]::Equals($walk,$parent,[StringComparison]::OrdinalIgnoreCase)){break}
   $walk=$parent
 }
 return $full
}
function Sha([string]$path) {
 if(-not (Test-Path -LiteralPath $path -PathType Leaf)){throw 'Required source file absent.'}
 if((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
   throw 'Reparse source file refused.'
 }
 return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Running-Node([string]$entry,[string]$nodeExe) {
 $quoted=[regex]::Escape($entry)
 return @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
   $_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$nodeExe,[StringComparison]::OrdinalIgnoreCase) -and
   $_.CommandLine -match ($quoted+'(?="|\s|$)')
 })
}
try {
 if(@($original).Count -ne 16 -or @($patch).Count -ne 5 -or
    @($original.path|Sort-Object -Unique).Count -ne 16 -or
    @($patch.path|Sort-Object -Unique).Count -ne 5 -or
    @($patch|Where-Object {$original.path -ccontains $_.path}).Count -ne 2) {
    throw 'Unexpected baseline or patch manifest.'
 }
 if(-not (Test-Path -LiteralPath $app -PathType Container)) {throw 'Existing app missing; no new install is allowed.'}
 if((Get-Content -LiteralPath (Join-Path $root 'worker-id.txt') -Raw).Trim() -cne $workerId) {
    throw 'Existing worker identity differs.'
 }
 $baselineExact=$true
 $targetExact=$true
 foreach($file in $original) {
   $path=Expected-Path $app $file.path
   $actual=Sha $path
   if($actual -cne $file.sha256) {$baselineExact=$false}
   $wanted=@($patch|Where-Object {$_.path -ceq $file.path})
   if($wanted.Count -eq 1) {
      if($actual -cne $wanted[0].sha256) {$targetExact=$false}
   } elseif($actual -cne $file.sha256) {
      $targetExact=$false
   }
 }
 foreach($file in $patch) {
   if($original.path -ccontains $file.path){continue}
   $path=Expected-Path $app $file.path
   if(Test-Path -LiteralPath $path) {
     # Never overwrite a previously unknown additional source file.
     if((Sha $path) -cne $file.sha256) {throw 'Unrecognized safe-tool file exists; no changes made.'}
   } else { $targetExact=$false }
 }
 if($targetExact) {
   Write-Host 'Verified safe-tool extension already installed. No files or Scheduled Task changed.'
   $cleanSuccess=$true
 } else {
   if(-not $baselineExact) {throw 'The existing 16-source worker differs. No files modified.'}
   $task=Get-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   if($task.Settings.Enabled -ne $true -or $task.State -ne 'Running') {
     throw 'Existing Scheduled Task is not enabled and running. No modification made.'
   }
   $taskXml=Export-ScheduledTask -TaskPath '\' -TaskName $taskName
   $entry=Expected-Path $app 'clean-room/src/worker/pc-worker-cli.mjs'
   $launcher=Join-Path $app 'COMMAND_CENTER_PC_WINDOWS.ps1'
   if($task.Actions.Count -ne 1 -or $task.Actions[0].Arguments.IndexOf($launcher,[StringComparison]::OrdinalIgnoreCase) -lt 0) {
      throw 'Task does not launch the expected existing Windows worker.'
   }
   $nodeExe=(Get-Content -LiteralPath (Join-Path $root 'node-path.txt') -Raw).Trim()
   $model=(Get-Content -LiteralPath (Join-Path $root 'model-name.txt') -Raw).Trim()
   if($model -cne 'qwen3:4b-instruct' -or -not (Test-Path -LiteralPath $nodeExe -PathType Leaf)) {
      throw 'Existing model or Node binary differs.'
   }
   $nodeVersion=(& $nodeExe --version).Trim()
   if($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22) {
      throw 'Node 22 or higher is required; no install performed.'
   }
   $tags=Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20 -ErrorAction Stop
   $actualModels=@($tags.models | Where-Object { $_.name -ceq $model })
   if($actualModels.Count -ne 1 -or $actualModels[0].digest -cne $modelDigest) {
      throw 'Existing local model digest does not match; refused.'
   }
   $existing=@(Running-Node $entry $nodeExe)
   if($existing.Count -gt 1) {throw 'Multiple existing worker processes found; refused.'}
   $stage=Join-Path ([IO.Path]::GetTempPath()) ('cc-safe-lane-'+[guid]::NewGuid().ToString('N'))
   $null=New-Item -ItemType Directory -Path $stage
   foreach($file in $patch) {
      $dst=Expected-Path $stage $file.path
      $null=New-Item -ItemType Directory -Path (Split-Path $dst) -Force
      $url='https://raw.githubusercontent.com/jamesmorgan1234/James-morgan-project-command-center/'+$commit+'/'+$file.path
      Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $dst -TimeoutSec 60 -ErrorAction Stop
      if((Sha $dst) -cne $file.sha256) {throw 'Pinned source SHA256 mismatch; installation refused.'}
      & $nodeExe --check $dst
      if($LASTEXITCODE -ne 0) {throw 'Node syntax check failed; installation refused.'}
   }
   # Only our existing worker process and its existing Task are paused.
   Stop-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   $stopped=$true
   foreach($proc in $existing) {
      $matches=@(Running-Node $entry $nodeExe | Where-Object {$_.ProcessId -eq $proc.ProcessId})
      if($matches.Count -eq 1){ Stop-Process -Id $proc.ProcessId -ErrorAction Stop }
   }
   if(@(Running-Node $entry $nodeExe).Count -ne 0){throw 'Original worker process remains; refusing concurrent source changes.'}
   foreach($file in $patch) {
      $dst=Expected-Path $app $file.path
      $replacements+=,$file.path
      if(Test-Path -LiteralPath $dst -PathType Leaf) {
         $saved=Expected-Path $stage ($file.path)
         $backupFile=$saved+'.original'
         Copy-Item -LiteralPath $dst -Destination $backupFile -ErrorAction Stop
         $backup[$file.path]=$backupFile
      }
      $null=New-Item -ItemType Directory -Path (Split-Path $dst) -Force
      Copy-Item -LiteralPath (Expected-Path $stage $file.path) -Destination $dst -Force -ErrorAction Stop
      if((Sha $dst) -cne $file.sha256){throw 'Post-copy source SHA256 mismatch; rollback required.'}
   }
   # Local read-only smoke test; no credentials, HTTP, paid services or company work.
   $probe=Join-Path $stage 'safe-probe.mjs'
   @'
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=process.argv[2];
const baseUrl=(relative)=>pathToFileURL(base+'/'+relative).href;
const {executePcSafeReadOnly,canonicalPublicDocsUrl,publicIpv4}=await import(baseUrl('clean-room/src/worker/pc-safe-readonly-tools.mjs'));
const {createPcSafeToolRunner}=await import(baseUrl('clean-room/src/worker/pc-safe-tool-runner.mjs'));
const code=JSON.parse(await executePcSafeReadOnly('code.js_syntax_check',JSON.stringify({source:'const answer=42;'})));
assert.equal(code.syntaxValid,true);assert.equal(code.executed,false);assert.equal(code.paidUsageAuthorized,false);
assert.throws(()=>canonicalPublicDocsUrl('https://127.0.0.1/private'));
assert.equal(publicIpv4('127.0.0.1'),false);
const ownerId='7ab6909d-f4bc-451a-b4c5-0512327a3f22';
const workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f';
const jobId='02ef1851-76ec-4820-a7b9-6b2285dce49a';
const inputText=JSON.stringify({source:'const safe=42;'});
const hash=s=>createHash('sha256').update(s).digest('hex');
const saved={jobId,ownerId,workerId,projectId:'project:company:future:014',companyId:'company:future:014',
brainKey:'brain:company:future:014:v1',brainVersion:2,actionKey:'code.js_syntax_check',inputText,inputHash:hash(inputText),toolVersion:'safe-readonly-v1'};
const lease={jobId,ownerId,workerId,projectId:saved.projectId,companyId:saved.companyId,
actionKey:saved.actionKey,fencingToken:1,generation:1,expiresAt:new Date(Date.now()+150000).toISOString()};
let committed=null,steps=[];
const transport={
next:async()=>{steps.push('next');return{saved,lease}},
current:async()=>steps.push('current'),
commit:async(_lease,result)=>{steps.push('commit');committed=result},
readback:async()=>{steps.push('readback');return{jobId,state:'completed',fencingToken:1,commitId:'aa4bdacf-01a1-4857-adb5-918ed13c8821',
 canonicalCommitVerified:true,result:{...committed}}},
abandon:()=>steps.push('abandon')
};
const result=await createPcSafeToolRunner({transport}).once();
assert.equal(result.state,'verified_safe_tool_job');
assert.equal(result.canonicalCommitVerified,true);
assert.equal(committed.generalCompanyExecution,false);
assert.equal(committed.companyBuildStarted,false);
assert.equal(committed.paidUsageAuthorized,false);
assert.deepEqual(steps,['next','current','current','commit','readback','abandon']);
console.log('Verified: safe source syntax, no-network code check, private-target rejection, mocked canonical commit/readback; no company execution');
'@ | Set-Content -LiteralPath $probe -Encoding Ascii
   & $nodeExe $probe $app
   if($LASTEXITCODE -ne 0){throw 'Safe local read-only smoke test failed; rollback required.'}
   if((Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -cne $taskXml){
      throw 'Existing Scheduled Task settings changed unexpectedly; rollback required.'
   }
   Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   $stopped=$false
   Write-Host 'COMMAND CENTER safe-tool extension updated in place and locally tested.'
   Write-Host 'Existing worker identity, credentials, Ollama model and Task definition preserved; no paid or company operations.'
   Write-Host 'Cloud readback is still required before calling live safe-tool execution verified.'
   $cleanSuccess=$true
 }
} catch {
 $reason=$_.Exception.Message
 if($stopped) {
   for($i=$replacements.Count-1;$i -ge 0;$i--) {
     $relative=$replacements[$i]
     $dst=Expected-Path $app $relative
     if($backup.ContainsKey($relative)) {
        Copy-Item -LiteralPath $backup[$relative] -Destination $dst -Force -ErrorAction Stop
     } elseif(Test-Path -LiteralPath $dst) {
        Remove-Item -LiteralPath $dst -Force -ErrorAction Stop
     }
   }
   if($taskXml -and (Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -ceq $taskXml) {
      Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   }
 }
 Write-Error ('Safe-tool extension stopped: '+$reason)
 throw
} finally {
 if($stage -and (Test-Path -LiteralPath $stage) -and ($cleanSuccess -or -not $stopped)) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
 }
}
