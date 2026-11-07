# COMMAND CENTER - existing Windows worker one-file public-docs reliability repair.
# Exact source pin, full 19-source preflight, no ZIPs, account changes, paid services or company builds.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f'
$modelId='qwen3:4b-instruct'
$modelDigest='0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0'
$sourceRevision='a07603d0bc7bb6136758298d0f6e6d01539c9691'
$taskName='COMMAND CENTER Owner PC Brain Worker'
$root=Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER'
$app=Join-Path $root 'app'
$relative='clean-room/src/worker/pc-safe-readonly-tools.mjs'
$oldHash='f5d523e26746d61cd6eeffb8f337ebe5bd0ea9755ba6fa06e5044548645d4117'
$newHash='c98f5a88e16b08debda82a8f889f6d3a66ea3300a9484b9a9a7a04e2ef5fa878'
$baseline=@'
[{"path":"clean-room/src/worker/pc-worker-cli.mjs","sha256":"ab3d70e1097984529cf7e1dd9ea466011d555227290d7cf193082c52ce0607ac"},{"path":"clean-room/src/worker/pc-worker-supervisor.mjs","sha256":"7093c0d31fdb75aa7c92fe1b5cc2e7827e8edde6dc4a2cd3e510152f6416ce17"},{"path":"clean-room/src/worker/pc-worker-transport.mjs","sha256":"572fd5f28efa9c65d59260de14a00faa0dec813f2beaa390b87827aff91758e0"},{"path":"clean-room/src/brain/pc-local-ollama.mjs","sha256":"4965b5ab518f72d18420236828f225f266831def62b3be180692c3c4ed7317dd"},{"path":"clean-room/src/brain/pc-owner-inference-worker.mjs","sha256":"eaff92020cae4a0e1155cbd20a8520de0818ce6e9d916478963a2c84721dae41"},{"path":"clean-room/src/brain/pc-brain-readiness.mjs","sha256":"9aedb4292e97c768643c886ac853d72cc6514381eb2c9ebf4f77e3aed859d6e6"},{"path":"clean-room/src/brain/pc-activation-contract.mjs","sha256":"674b9ef0f50b9898336785732218494e6aa538890d31a40989c46c1132202062"},{"path":"clean-room/src/worker/pc-artifact-job-runner.mjs","sha256":"0d75969d549d51e5403e7d6e3ca7e381bed455d8bdc373f474c9ab668fdcbf13"},{"path":"clean-room/src/worker/pc-activation-exchange-runner.mjs","sha256":"da9ce5eb85585c6e01be0cfcafdcd398f3d3e0bdbce76d37297f6e0c9f0c3893"},{"path":"clean-room/src/worker/pc-activation-exchange-transport.mjs","sha256":"7bdbb09dc9c5c02340b0eaca789825cafd8759db78facf5ffd58287ef3f0087f"},{"path":"clean-room/src/worker/pc-tool-job-transport.mjs","sha256":"272f18beaff201edf173e91726d459ce507f5f404da95e5f8477ac3c7842e673"},{"path":"clean-room/src/worker/pc-tool-execution-lane.mjs","sha256":"0bfa9aef34fefc0b9acbf0e6a3b067787556ce66f9addaa1debdfd6c8ad81fed"},{"path":"clean-room/src/worker/pc-tool-journal.mjs","sha256":"45431510115657c42d98a9d5dc4ccedcead00f20f279f8d24a3ac37784d82ec0"},{"path":"clean-room/src/worker/pc-project-file-tool.mjs","sha256":"1e17349eaddff1a416921ce78ec0d7f0e7065bcb2672ab2b377b0179d2a9956b"},{"path":"clean-room/src/brain/tool-runtime.mjs","sha256":"ae16b8defb2fc3a5c5f5a702dc137140d8f408916c371eb6ddafb50e2fec5f03"},{"path":"clean-room/src/brain/tool-access.mjs","sha256":"2f40b5d33c9a5bc466bbe588ff3eea67c6a3a055dceed17b5679d944d43bb7b4"},{"path":"clean-room/src/worker/pc-safe-tool-runner.mjs","sha256":"83b290176252dd6b4665d146f9262403741cb6712a044c89e5791728a28d1f34"},{"path":"clean-room/src/worker/pc-safe-tool-transport.mjs","sha256":"3e63b6ef0a394aa8a7737e35c9f0f7c6030095f502c3beea0d55a4ec06f11474"},{"path":"clean-room/src/worker/pc-safe-readonly-tools.mjs","sha256":"f5d523e26746d61cd6eeffb8f337ebe5bd0ea9755ba6fa06e5044548645d4117"}]
'@ | ConvertFrom-Json
$stage=$null
$taskXml=$null
$stopped=$false
$complete=$false
function Source-Path([string]$base,[string]$relativePath){
 if(-not ($baseline.path -ccontains $relativePath)){throw 'Source outside verified worker manifest'}
 if($relativePath -notmatch '^clean-room/src/(worker|brain)/[a-z0-9-]+\.mjs$'){
    throw 'Invalid module path'
 }
 $base=[IO.Path]::GetFullPath($base)
 $dest=[IO.Path]::GetFullPath((Join-Path $base ($relativePath.Replace('/',[IO.Path]::DirectorySeparatorChar))))
 if(-not $dest.StartsWith($base+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){
    throw 'Source escapes the pinned worker root'
 }
 $path=Split-Path $dest
 while($path -and $path.Length -ge $base.Length){
    if(Test-Path -LiteralPath $path) {
       if((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){
         throw 'Symlink/junction in the worker path refused'
       }
    }
    if([string]::Equals($path,$base,[StringComparison]::OrdinalIgnoreCase)){break}
    $next=Split-Path $path
    if($path -eq $next){break}
    $path=$next
 }
 return $dest
}
function Sha([string]$file){
 if(-not (Test-Path -LiteralPath $file -PathType Leaf)){throw 'Required file missing'}
 if((Get-Item -LiteralPath $file -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){
    throw 'File symlink refused'
 }
 return (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Matching-Worker([string]$entry,[string]$nodeExe){
 $pattern=[regex]::Escape($entry)+'(?="|\s|$)'
 return @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$nodeExe,[StringComparison]::OrdinalIgnoreCase) -and
    $_.CommandLine -match $pattern
 })
}
try{
 if(@($baseline).Count -ne 19 -or @($baseline.path|Sort-Object -Unique).Count -ne 19){
   throw '19-file verified worker manifest changed'
 }
 if(-not (Test-Path -LiteralPath $app -PathType Container)){throw 'Existing app not installed'}
 if((Get-Content -LiteralPath (Join-Path $root 'worker-id.txt') -Raw).Trim() -cne $workerId){
    throw 'Worker identity mismatch'
 }
 $allBefore=$true;$alreadyUpdated=$true
 foreach($item in $baseline){
    $target=Source-Path $app $item.path
    $digest=Sha $target
    if($digest -cne $item.sha256){$allBefore=$false}
    $expected=if($item.path -ceq $relative){$newHash}else{$item.sha256}
    if($digest -cne $expected){$alreadyUpdated=$false}
 }
 if($alreadyUpdated){
    Write-Host 'Public-document reliability repair already installed; no source or Task changes.'
    $complete=$true
 } else {
   if(-not $allBefore){throw 'Installed worker source differs; no changes attempted'}
   $task=Get-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   if($task.Settings.Enabled -ne $true -or $task.State -ne 'Running'){
     throw 'Existing worker task is not enabled and running'
   }
   $taskXml=Export-ScheduledTask -TaskPath '\' -TaskName $taskName
   if($task.Actions.Count -ne 1){throw 'Existing task has unexpected number of actions'}
   $entry=Source-Path $app 'clean-room/src/worker/pc-worker-cli.mjs'
   $launcher=Join-Path $app 'COMMAND_CENTER_PC_WINDOWS.ps1'
   if($task.Actions[0].Arguments.IndexOf($launcher,[StringComparison]::OrdinalIgnoreCase) -lt 0){
      throw 'Task does not launch the exact existing worker'
   }
   $nodeExe=(Get-Content -LiteralPath (Join-Path $root 'node-path.txt') -Raw).Trim()
   if(-not (Test-Path -LiteralPath $nodeExe -PathType Leaf)){throw 'Installed Node executable missing'}
   $version=(& $nodeExe --version).Trim()
   if($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22){
      throw 'Requires existing Node.js 22 or newer'
   }
   $model=(Get-Content -LiteralPath (Join-Path $root 'model-name.txt') -Raw).Trim()
   if($model -cne $modelId){throw 'Existing local model differs'}
   $models=Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20
   $installed=@($models.models|Where-Object {$_.name -ceq $modelId})
   if($installed.Count -ne 1 -or $installed[0].digest -cne $modelDigest){
      throw 'Existing local model digest changed'
   }
   $workers=@(Matching-Worker $entry $nodeExe)
   if($workers.Count -ne 1){throw 'Expected exactly one existing running worker'}
   $stage=Join-Path ([IO.Path]::GetTempPath()) ('cc-docs-repair-'+[guid]::NewGuid().ToString('N'))
   $null=New-Item -ItemType Directory -Path $stage
   $source=Join-Path $stage 'pc-safe-readonly-tools.mjs'
   $backup=Join-Path $stage 'original-pc-safe-readonly-tools.mjs'
   $target=Source-Path $app $relative
   Copy-Item -LiteralPath $target -Destination $backup -ErrorAction Stop
   if((Sha $backup) -cne $oldHash){throw 'Backup digest differs'}
   $url='https://raw.githubusercontent.com/jamesmorgan1234/James-morgan-project-command-center/'+$sourceRevision+'/'+$relative
   Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $source -TimeoutSec 60 -ErrorAction Stop
   if((Sha $source) -cne $newHash){throw 'Downloaded exact source SHA-256 mismatch'}
   & $nodeExe --check $source
   if($LASTEXITCODE -ne 0){throw 'New local module syntax check failed'}
   $probe=Join-Path $stage 'docs-negative-proof.mjs'
   @'
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const src=await import(pathToFileURL(process.argv[2]).href);
const url='https://www.rfc-editor.org/rfc/rfc1149.txt';
await assert.rejects(src.readAllowedPublicDocs(url,{
  dns:async()=>new Promise(()=>{}),dnsTimeoutMs:25
}),/docs_dns_timeout/);
const result=JSON.parse(await src.executePcSafeReadOnly('research.public_docs_read',
  JSON.stringify({url}),{readDocs:async()=>{throw Error('docs_dns_timeout')}}));
assert.equal(result.readSucceeded,false);
assert.equal(result.errorCode,'docs_dns_timeout');
assert.equal(result.paidUsageAuthorized,false);
assert.equal(result.executed,false);
await assert.rejects(src.executePcSafeReadOnly('research.public_docs_read',
  JSON.stringify({url:'https://127.0.0.1/private'}),{readDocs:async()=>{throw Error('should not execute')}}),
  /docs_scope_denied/);
console.log('PASS: bounded DNS, sanitized negative receipt, blocked private URL; no real network, company work or paid service');
'@ | Set-Content -LiteralPath $probe -Encoding Ascii
   & $nodeExe $probe $source
   if($LASTEXITCODE -ne 0){throw 'Local read-only negative-receipt smoke test failed'}
   Stop-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   $stopped=$true
   foreach($worker in $workers){
     $alive=@(Matching-Worker $entry $nodeExe|Where-Object {$_.ProcessId -eq $worker.ProcessId})
     if($alive.Count -eq 1){Stop-Process -Id $worker.ProcessId -ErrorAction Stop}
   }
   if(@(Matching-Worker $entry $nodeExe).Count -ne 0){throw 'Old worker did not fully stop'}
   Copy-Item -LiteralPath $source -Destination $target -Force -ErrorAction Stop
   if((Sha $target) -cne $newHash){throw 'Copied file hash invalid; restoring original'}
   if((Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -cne $taskXml){
     throw 'Task definition unexpectedly changed; restoring original'
   }
   Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
   $running=$false
   for($i=0;$i -lt 30;$i++){
      Start-Sleep -Milliseconds 500
      $current=Get-ScheduledTask -TaskPath '\' -TaskName $taskName
      if($current.State -eq 'Running'){$running=$true;break}
   }
   if(-not $running){throw 'Updated worker Task did not run; restoring original'}
   $stopped=$false;$complete=$true
   Write-Host 'COMMAND CENTER one-file public-docs reliability update complete and locally tested.'
   Write-Host 'Same owner PC worker, credentials, local model and Task definition; 128 earlier Brain results preserved.'
   Write-Host 'Only the safe public-docs network adapter was changed. Canonical cloud verification still required.'
 }
} catch {
  $problem=$_.Exception.Message
  if($stopped){
    Stop-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction SilentlyContinue
    $running=@(Matching-Worker $entry $nodeExe)
    foreach($proc in $running){Stop-Process -Id $proc.ProcessId -ErrorAction SilentlyContinue}
    if(Test-Path -LiteralPath $backup){
      Copy-Item -LiteralPath $backup -Destination $target -Force -ErrorAction Stop
      if((Sha $target) -cne $oldHash){throw 'ROLLBACK FILE HASH FAILED. Existing backup retained at '+$backup}
    }
    if((Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -ceq $taskXml){
      Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
    }
  }
  Write-Error ('Read-only docs repair stopped: '+$problem)
  throw
} finally {
  if($stage -and (Test-Path -LiteralPath $stage) -and ($complete -or -not $stopped)){
     Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
  }
}
