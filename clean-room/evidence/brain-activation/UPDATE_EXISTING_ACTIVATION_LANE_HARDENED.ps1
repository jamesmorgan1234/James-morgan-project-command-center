# COMMAND CENTER: guarded, no-ZIP, 3-module in-place patch of the already paired 16-module Windows client.
# Source: pinned Git commit 455748f30474951ab2e60dfb350f61aaff7908d0. Zero spend, no company runs, no other projects.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$worker='737f5e7c-3884-4c61-81ac-634bdfc4828f'
$taskName='COMMAND CENTER Owner PC Brain Worker'
$sourceCommit='455748f30474951ab2e60dfb350f61aaff7908d0'
$root=Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER'
$app=Join-Path $root 'app'
$stage=$null;$backup=$null;$taskXml=$null;$stopped=$false;$updatedPaths=@();$success=$false
$before=@'
[{"path":"clean-room/src/worker/pc-worker-cli.mjs","sha256":"681aeb130d82659cf65d05573a4061fdb86402168a37c6e7911cbfc9374bcd70"},{"path":"clean-room/src/worker/pc-worker-supervisor.mjs","sha256":"ca1765241151c005d5f444e8d20ad14942c8adc23e4e45ae407c6cc58d51a16d"},{"path":"clean-room/src/worker/pc-worker-transport.mjs","sha256":"572fd5f28efa9c65d59260de14a00faa0dec813f2beaa390b87827aff91758e0"},{"path":"clean-room/src/brain/pc-local-ollama.mjs","sha256":"16c4a0c79a78a5103e06ec669610f18a9651900da4e799d2fbd819e4890d6994"},{"path":"clean-room/src/brain/pc-owner-inference-worker.mjs","sha256":"eaff92020cae4a0e1155cbd20a8520de0818ce6e9d916478963a2c84721dae41"},{"path":"clean-room/src/brain/pc-brain-readiness.mjs","sha256":"9aedb4292e97c768643c886ac853d72cc6514381eb2c9ebf4f77e3aed859d6e6"},{"path":"clean-room/src/brain/pc-activation-contract.mjs","sha256":"674b9ef0f50b9898336785732218494e6aa538890d31a40989c46c1132202062"},{"path":"clean-room/src/worker/pc-artifact-job-runner.mjs","sha256":"0d75969d549d51e5403e7d6e3ca7e381bed455d8bdc373f474c9ab668fdcbf13"},{"path":"clean-room/src/worker/pc-activation-exchange-runner.mjs","sha256":"452a620a2523c7169a231d14192ff7f751795f142c066f9a37010f308cdee1ba"},{"path":"clean-room/src/worker/pc-activation-exchange-transport.mjs","sha256":"7bdbb09dc9c5c02340b0eaca789825cafd8759db78facf5ffd58287ef3f0087f"},{"path":"clean-room/src/worker/pc-tool-job-transport.mjs","sha256":"272f18beaff201edf173e91726d459ce507f5f404da95e5f8477ac3c7842e673"},{"path":"clean-room/src/worker/pc-tool-execution-lane.mjs","sha256":"0bfa9aef34fefc0b9acbf0e6a3b067787556ce66f9addaa1debdfd6c8ad81fed"},{"path":"clean-room/src/worker/pc-tool-journal.mjs","sha256":"45431510115657c42d98a9d5dc4ccedcead00f20f279f8d24a3ac37784d82ec0"},{"path":"clean-room/src/worker/pc-project-file-tool.mjs","sha256":"1e17349eaddff1a416921ce78ec0d7f0e7065bcb2672ab2b377b0179d2a9956b"},{"path":"clean-room/src/brain/tool-runtime.mjs","sha256":"ae16b8defb2fc3a5c5f5a702dc137140d8f408916c371eb6ddafb50e2fec5f03"},{"path":"clean-room/src/brain/tool-access.mjs","sha256":"2f40b5d33c9a5bc466bbe588ff3eea67c6a3a055dceed17b5679d944d43bb7b4"}]
'@ | ConvertFrom-Json
$after=@'
[{"path":"clean-room/src/worker/pc-worker-cli.mjs","sha256":"f6b718a8aabd6a82054baa23d6637aa722c8502422f9932cb45f6b656eaa3476"},{"path":"clean-room/src/brain/pc-local-ollama.mjs","sha256":"4965b5ab518f72d18420236828f225f266831def62b3be180692c3c4ed7317dd"},{"path":"clean-room/src/worker/pc-activation-exchange-runner.mjs","sha256":"da9ce5eb85585c6e01be0cfcafdcd398f3d3e0bdbce76d37297f6e0c9f0c3893"}]
'@ | ConvertFrom-Json
function File-Hash([string]$path){return (Get-FileHash -LiteralPath $path -Algorithm SHA256 -ErrorAction Stop).Hash.ToLowerInvariant()}
function Scoped-Path([string]$parent,[string]$rel){
 if($rel -cnotin @($before.path)){throw 'Source path outside the exact installed 16-file baseline.'}
 $p=Join-Path $parent ($rel.Replace('/',[IO.Path]::DirectorySeparatorChar))
 $check=$p
 while($check -and $check.Length -ge $parent.Length){
  if((Test-Path -LiteralPath $check) -and ((Get-Item -LiteralPath $check -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){
   throw 'Symbolic or reparse-point source path refused.'
  }
  if([string]::Equals($check,$parent,[StringComparison]::OrdinalIgnoreCase)){break}
  $check=Split-Path -Path $check
 }
 return $p
}
function Existing-Processes([string]$entry,[string]$node){
 $pattern=[regex]::Escape($entry)+'(?="|\s|$)'
 return @(Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
  $_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$node,[StringComparison]::OrdinalIgnoreCase) -and $_.CommandLine -match $pattern
 })
}
try {
 if(@($before).Count -ne 16 -or @($after).Count -ne 3 -or @($before.path|Sort-Object -Unique).Count -ne 16 -or
    @($after.path|Sort-Object -Unique).Count -ne 3 -or @(Compare-Object @($after.path) @($before.path) -IncludeEqual -ExcludeDifferent).Count -ne 3){
  throw 'Source manifest count or path comparison invalid.'
 }
 if(-not(Test-Path -LiteralPath $app) -or (Get-Content -LiteralPath (Join-Path $root 'worker-id.txt') -Raw).Trim() -cne $worker){
  throw 'Registered worker identity differs. No changes made.'
 }
 $oldExact=$true;$newExact=$true
 foreach($file in $before){
  $path=Scoped-Path $app $file.path
  if(-not(Test-Path -LiteralPath $path)){throw 'Existing installed source missing; update refused.'}
  $actual=File-Hash $path
  if($actual -cne $file.sha256){$oldExact=$false}
  $new=@($after|Where-Object {$_.path -ceq $file.path})
  if($new.Count -eq 1){
   if($actual -cne $new[0].sha256){$newExact=$false}
  }elseif($actual -cne $file.sha256){$newExact=$false}
 }
 if($newExact){
  Write-Host 'Exact activation fix already installed; no process, files or Task changed.'
  $success=$true
 }else{
  if(-not $oldExact){throw 'Installed 16-file baseline differs; no overwrite attempted.'}
  $task=Get-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
  if($task.State -ne 'Running' -or $task.Settings.Enabled -ne $true){
   throw 'Existing worker Task is not Running and enabled; it will not be enabled or started by this updater.'
  }
  $taskXml=Export-ScheduledTask -TaskPath '\' -TaskName $taskName
  $launcher=Join-Path $app 'COMMAND_CENTER_PC_WINDOWS.ps1'
  if($task.Actions.Count -ne 1 -or $task.Actions[0].Arguments.IndexOf($launcher,[StringComparison]::OrdinalIgnoreCase) -lt 0){
   throw 'Existing Task points to an unexpected script; no change.'
  }
  $node=(Get-Content -LiteralPath (Join-Path $root 'node-path.txt') -Raw).Trim()
  $model=(Get-Content -LiteralPath (Join-Path $root 'model-name.txt') -Raw).Trim()
  if($model -cne 'qwen3:4b-instruct' -or -not(Test-Path -LiteralPath $node)){
   throw 'Existing local model or Node path differs.'
  }
  $nodeVersion=(& $node --version).Trim()
  if($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22){
   throw 'Node 22 or newer required; nothing installed.'
  }
  $tags=Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 20 -ErrorAction Stop
  $models=@($tags.models | Where-Object {$_.name -ceq $model})
  if($models.Count -ne 1 -or $models[0].digest -cne '0edcdef34593eac1aa2be9c7d06c432dcf81945adca5eca2f27662c18f168ba0'){
   throw 'Installed model/digest differs; no changes made.'
  }
  $entry=Scoped-Path $app 'clean-room/src/worker/pc-worker-cli.mjs'
  $processes=@(Existing-Processes $entry $node)
  if($processes.Count -gt 1){throw 'More than one existing Node worker found; update refused.'}
  $stage=Join-Path ([IO.Path]::GetTempPath()) ('cc-activation-patch-'+[guid]::NewGuid().ToString('N'))
  $null=New-Item -ItemType Directory -Path $stage
  foreach($file in $after){
   $out=Scoped-Path $stage $file.path
   $null=New-Item -ItemType Directory -Path (Split-Path $out) -Force
   $relative=$file.path.Replace('\','/')
   $uri='https://raw.githubusercontent.com/jamesmorgan1234/James-morgan-project-command-center/'+$sourceCommit+'/'+$relative
   Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $out -TimeoutSec 60 -ErrorAction Stop
   if((File-Hash $out) -cne $file.sha256){throw 'Downloaded pinned source hash mismatch; nothing installed.'}
   & $node --check $out
   if($LASTEXITCODE -ne 0){throw 'Pinned Node syntax verification failed; nothing installed.'}
  }
  # Preserve only the three source files being replaced. Never inspect or modify worker credentials.
  $backup=Join-Path $root ('activation-source-backup-'+[guid]::NewGuid().ToString('N'))
  $null=New-Item -ItemType Directory -Path $backup
  foreach($file in $after){
   $out=Scoped-Path $backup $file.path
   $null=New-Item -ItemType Directory -Path (Split-Path $out) -Force
   Copy-Item -LiteralPath (Scoped-Path $app $file.path) -Destination $out -ErrorAction Stop
  }
  Stop-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop;$stopped=$true
  foreach($proc in $processes){
   $still=@(Existing-Processes $entry $node|Where-Object {$_.ProcessId -eq $proc.ProcessId})
   if($still.Count -gt 0){Stop-Process -Id $proc.ProcessId -ErrorAction Stop}
  }
  if(@(Existing-Processes $entry $node).Count -ne 0){throw 'Old worker process still active; update refused.'}
  foreach($file in $after){
   $dst=Scoped-Path $app $file.path
   $updatedPaths+=,$file.path
   Copy-Item -LiteralPath (Scoped-Path $stage $file.path) -Destination $dst -Force -ErrorAction Stop
   if((File-Hash $dst) -cne $file.sha256){throw 'New source file hash mismatch; rollback required.'}
  }
  if((Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -cne $taskXml){throw 'Task configuration changed concurrently; rollback required.'}
  Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop;$stopped=$false
  $success=$true
  Write-Host 'Activation-only modules updated in place and hashes verified. Same worker, credentials, model, and Task definition preserved.'
  Write-Host 'The model has NOT yet passed native structured-output acceptance; verify exact receipts in COMMAND CENTER.'
 }
}catch{
 $message=$_.Exception.Message
 if($stopped){
  foreach($rel in $updatedPaths){
   $dst=Scoped-Path $app $rel;$src=Scoped-Path $backup $rel
   if(Test-Path -LiteralPath $src){Copy-Item -LiteralPath $src -Destination $dst -Force}
  }
  if($taskXml -and (Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -ceq $taskXml){
   Start-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
  }
 }
 Write-Error ('UPDATE STOPPED: '+$message)
 throw
}finally{
 if($stage -and (Test-Path -LiteralPath $stage)){Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue}
 if($success -and $backup -and (Test-Path -LiteralPath $backup)){Remove-Item -LiteralPath $backup -Recurse -Force -ErrorAction SilentlyContinue}
}
