# Update only the existing paired owner's read-only PC worker. No re-pairing.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$base=Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER'
$app=Join-Path $base 'app'
$payload=Join-Path $PSScriptRoot 'payload'
$manifest=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'UPDATE_MANIFEST.json') -Raw | ConvertFrom-Json
$taskName='COMMAND CENTER Owner PC Brain Worker'
$expectedWorker='737f5e7c-3884-4c61-81ac-634bdfc4828f'
$stopped=$false;$changed=@();$backup=$null;$taskXml=$null
$oldModel=$env:CC_PC_LOCAL_MODEL
$allowedPaths=@(
 'clean-room/src/worker/pc-worker-cli.mjs',
 'clean-room/src/worker/pc-worker-supervisor.mjs',
 'clean-room/src/worker/pc-worker-transport.mjs',
 'clean-room/src/worker/pc-artifact-job-runner.mjs',
 'clean-room/src/worker/pc-safe-tool-runner.mjs',
 'clean-room/src/worker/pc-safe-tool-transport.mjs',
 'clean-room/src/worker/pc-safe-readonly-tools.mjs',
 'clean-room/src/worker/pc-activation-exchange-runner.mjs',
 'clean-room/src/worker/pc-activation-exchange-transport.mjs',
 'clean-room/src/worker/pc-tool-job-transport.mjs',
 'clean-room/src/worker/pc-tool-execution-lane.mjs',
 'clean-room/src/worker/pc-tool-journal.mjs',
 'clean-room/src/worker/pc-project-file-tool.mjs',
 'clean-room/src/brain/pc-local-ollama.mjs',
 'clean-room/src/brain/pc-owner-inference-worker.mjs',
 'clean-room/src/brain/pc-brain-readiness.mjs',
 'clean-room/src/brain/pc-activation-contract.mjs',
 'clean-room/src/brain/tool-runtime.mjs',
 'clean-room/src/brain/tool-access.mjs'
)
function Hash-File([string]$path){return (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()}
function Safe-Path([string]$root,[string]$relative){
 if($relative -cnotin $allowedPaths){throw 'Unexpected source path; update refused.'}
 $path=Join-Path $root ($relative.Replace('/',[IO.Path]::DirectorySeparatorChar))
 $check=$path
 while($check -and $check.Length -ge $root.Length){
  if((Test-Path -LiteralPath $check) -and ((Get-Item -LiteralPath $check -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Linked source paths are not eligible for this update.'}
  if([string]::Equals($check,$root,[StringComparison]::OrdinalIgnoreCase)){break}
  $check=Split-Path $check
 }
 return $path
}
function Worker-Processes([string]$entry,[string]$node){
 $pattern=[regex]::Escape($entry)+'(?="|\s|$)'
 return @(Get-CimInstance Win32_Process | Where-Object {$_.ExecutablePath -and [string]::Equals($_.ExecutablePath,$node,[StringComparison]::OrdinalIgnoreCase) -and $_.CommandLine -match $pattern})
}
try{
 if($manifest.schema -ne 'cc-existing-pc-worker-update-v1' -or $manifest.candidateState -ne 'source-committed' -or $manifest.sourceCommit -notmatch '^[0-9a-f]{40}$'){throw 'Package is not a committed source candidate.'}
 if($manifest.workerId -ne $expectedWorker -or -not(Test-Path -LiteralPath $app)){throw 'Existing registered worker not found; nothing installed.'}
 if((Get-Content -LiteralPath (Join-Path $base 'worker-id.txt') -Raw).Trim() -ne $expectedWorker){throw 'Different worker identity; update refused.'}
 if(@($manifest.files).Count -ne 19 -or @($manifest.originalFiles).Count -ne 14 -or
    @($manifest.files.path | Sort-Object -Unique).Count -ne 19 -or
    @(Compare-Object $allowedPaths @($manifest.files.path) -CaseSensitive).Count -ne 0){throw 'Incomplete source manifest.'}
$added=@('clean-room/src/worker/pc-activation-exchange-runner.mjs','clean-room/src/worker/pc-activation-exchange-transport.mjs',
 'clean-room/src/worker/pc-safe-tool-runner.mjs', 'clean-room/src/worker/pc-safe-tool-transport.mjs', 'clean-room/src/worker/pc-safe-readonly-tools.mjs')
$expectedPrevious=@($allowedPaths | Where-Object {$_ -cnotin $added})
if($manifest.installedBaselineCommit -ne '41f46935f8524c47355199ca02651b5d4ecc6dce' -or
   @($manifest.originalFiles.path | Sort-Object -Unique).Count -ne 14 -or
   @(Compare-Object $expectedPrevious @($manifest.originalFiles.path) -CaseSensitive).Count -ne 0){
 throw 'Installed source baseline does not match previously verified tool client.'
}
 foreach($file in $manifest.files){if($file.sha256 -notmatch '^[0-9a-f]{64}$' -or (Hash-File (Safe-Path $payload $file.path)) -ne $file.sha256){throw 'Payload hash mismatch.'}}
 $already=$true
 foreach($file in $manifest.files){$target=Safe-Path $app $file.path;if(-not(Test-Path -LiteralPath $target) -or (Hash-File $target) -ne $file.sha256){$already=$false}}
 if($already){Write-Host 'This exact client source is already installed. No files or tasks changed.';exit 0}
 foreach($file in $manifest.originalFiles){if((Hash-File (Safe-Path $app $file.path)) -ne $file.sha256){throw 'Installed source differs from recovered original; no overwrite performed.'}}
 $task=Get-ScheduledTask -TaskPath '\' -TaskName $taskName -ErrorAction Stop
 if($task.State -ne 'Running' -or $task.Settings.Enabled -ne $true){throw 'Existing worker task is not running and enabled. It will not be restarted or enabled by this updater.'}
 $taskXml=Export-ScheduledTask -TaskPath '\' -TaskName $taskName
 if($task.Actions.Count -ne 1 -or $task.Actions[0].Arguments.IndexOf((Join-Path $app 'COMMAND_CENTER_PC_WINDOWS.ps1'),[StringComparison]::OrdinalIgnoreCase) -lt 0){throw 'Unexpected existing Task action; no task changed.'}
 $node=(Get-Content -LiteralPath (Join-Path $base 'node-path.txt') -Raw).Trim()
 $model=(Get-Content -LiteralPath (Join-Path $base 'model-name.txt') -Raw).Trim()
 if($model -ne 'qwen3:4b-instruct' -or -not(Test-Path -LiteralPath $node)){throw 'Existing local model or Node configuration differs.'}
 $version=(& $node --version).Trim()
 if($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 22){throw 'Existing Node 22 or newer is required; no installation was attempted.'}
 foreach($file in $manifest.files){& $node --check (Safe-Path $payload $file.path);if($LASTEXITCODE -ne 0){throw 'New client syntax check failed.'}}
 $env:CC_PC_LOCAL_MODEL=$model
 $selfTest=& $node (Safe-Path $payload 'clean-room/src/worker/pc-worker-cli.mjs') --self-test
 if($LASTEXITCODE -ne 0){throw 'New client local inference self-test failed. Existing worker untouched.'}
 $proof=$selfTest | ConvertFrom-Json
 if($proof.realInferenceVerified -ne $true -or $proof.localModelId -ne $model -or $proof.remoteInference -ne $false -or $proof.modelDigest -notmatch '^[0-9a-f]{64}$'){throw 'Local inference self-test did not verify.'}
 $entry=Safe-Path $app 'clean-room/src/worker/pc-worker-cli.mjs'
 $processes=Worker-Processes $entry $node
 if($processes.Count -gt 1){throw 'Multiple existing worker processes require review; nothing changed.'}
 $backup=Join-Path $base ('source-backup-'+[guid]::NewGuid().ToString('N'))
 $null=New-Item -ItemType Directory -Path $backup
 foreach($file in $manifest.files){$target=Safe-Path $app $file.path;if(Test-Path -LiteralPath $target){$dest=Safe-Path $backup $file.path;$null=New-Item -ItemType Directory -Path (Split-Path $dest) -Force;Copy-Item -LiteralPath $target -Destination $dest}}
 Stop-ScheduledTask -TaskPath '\' -TaskName $taskName;$stopped=$true
 # Only the previously identified exact worker process may be terminated.
 foreach($proc in $processes){$current=Worker-Processes $entry $node | Where-Object {$_.ProcessId -eq $proc.ProcessId};if($current){Stop-Process -Id $proc.ProcessId -ErrorAction Stop}}
 if((Worker-Processes $entry $node).Count -ne 0){throw 'Existing worker process has not stopped; code was not replaced.'}
 foreach($file in $manifest.files){
  $target=Safe-Path $app $file.path;$null=New-Item -ItemType Directory -Path (Split-Path $target) -Force
  $changed+=,$file.path;Copy-Item -LiteralPath (Safe-Path $payload $file.path) -Destination $target -Force
  if((Hash-File $target) -ne $file.sha256){throw 'Installed file verification failed.'}
 }
 if((Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -cne $taskXml){throw 'Task definition changed concurrently; verification required.'}
 Start-ScheduledTask -TaskPath '\' -TaskName $taskName;$stopped=$false
 $report=[ordered]@{schema='cc-existing-pc-worker-update-result-v1';sourceCommit=$manifest.sourceCommit;workerId=$expectedWorker;codeHashesVerified=$true;localInferenceSelfTestVerified=$true;modelDigest=$proof.modelDigest;taskDefinitionPreserved=$true;credentialFilesReadOrChanged=$false;pairingRecreated=$false;fullBrainActivationClaimed=$false;companyBuildStarted=$false;recordedAt=[DateTime]::UtcNow.ToString('o')}
 $report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $base 'CLIENT_UPDATE_RESULT.json') -Encoding UTF8
 Write-Host 'Existing PC client source updated and locally tested. Same worker, credentials and Task definition preserved.'
 Write-Host 'Specialist live verification is still performed by COMMAND CENTER; this update does not start a company build.'
}catch{
 $reason=$_.Exception.Message
 if($stopped){
  foreach($relative in $changed){$target=Safe-Path $app $relative;$old=Safe-Path $backup $relative;if(Test-Path -LiteralPath $old){Copy-Item -LiteralPath $old -Destination $target -Force}else{Remove-Item -LiteralPath $target -ErrorAction SilentlyContinue}}
  # Resume only the same previously running Task when its definition is unchanged.
  if($taskXml -and (Export-ScheduledTask -TaskPath '\' -TaskName $taskName) -ceq $taskXml -and (Worker-Processes $entry $node).Count -eq 0){Start-ScheduledTask -TaskPath '\' -TaskName $taskName}
 }
 Write-Host ('UPDATE STOPPED: '+$reason)
 exit 1
}finally{$env:CC_PC_LOCAL_MODEL=$oldModel}
