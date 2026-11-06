# COMMAND CENTER secure local-only pairing and Windows user-session worker.
# Owner-controlled. No company operations, payment requests, GitHub writes, or cloud inference.
[CmdletBinding()]
param([ValidateSet('Prepare','Verify','EnableBackground','Run','DisableBackground','Status')][string]$Action='Prepare')
$ErrorActionPreference='Stop'
$ccBase=Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER'
$app=Join-Path $ccBase 'app'
$credential=Join-Path $ccBase 'worker-token.dpapi'
$idPath=Join-Path $ccBase 'worker-id.txt'
$hashPath=Join-Path $ccBase 'token-digest.txt'
$modelPath=Join-Path $ccBase 'model-name.txt'
$nodePathFile=Join-Path $ccBase 'node-path.txt'
$logPath=Join-Path $ccBase 'worker-events.log'
$reportPath=Join-Path $PSScriptRoot 'COMMAND_CENTER_PC_PAIRING_REQUEST.json'
$taskName='COMMAND CENTER Owner PC Brain Worker'
$model='qwen3:4b-instruct'
$gateway='https://gmlsucpwliegwlxymjvp.supabase.co/functions/v1/command-center-pc-worker'
function Require-Node {
  if(Test-Path -LiteralPath $nodePathFile){
    $n=(Get-Content -LiteralPath $nodePathFile -Raw).Trim()
    if(Test-Path -LiteralPath $n){return $n}
  }
  $n=(Get-Command node.exe -ErrorAction SilentlyContinue).Source
  if(-not $n){throw 'Node.js not found. Your earlier hardware report had Node.js, but it is not currently accessible.'}
  $v=(& $n --version).Trim()
  $major=[int]($v -replace '^v(\d+).*','$1')
  if($major -lt 22){throw 'Node.js 22 or newer is required.'}
  return $n
}
function Require-Model {
  $models=Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 15 -Method Get
  $installed=@($models.models | Where-Object {$_.name -eq $model})
  if($installed.Count -lt 1){throw 'The verified local model is not available. Start Ollama; it must have qwen3:4b-instruct installed.'}
}
function Require-Encrypted-Credential {
  if(-not(Test-Path -LiteralPath $credential) -or -not(Test-Path -LiteralPath $idPath) -or
    -not(Test-Path -LiteralPath $hashPath) -or -not(Test-Path -LiteralPath $modelPath)){
    throw 'No prepared local pairing request. Double-click 1_PREPARE_SECURE_PAIRING_WINDOWS first.'
  }
  $wid=(Get-Content -LiteralPath $idPath -Raw).Trim()
  if($wid -notmatch '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'){
    throw 'Local worker ID is invalid.'
  }
  return $wid
}
function Plaintext-Token {
  $cipher=(Get-Content -LiteralPath $credential -Raw).Trim()
  $secure=ConvertTo-SecureString $cipher
  $ptr=[System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)}
  finally {[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)}
}
function Verify-Cloud {
  $wid=Require-Encrypted-Credential
  $token=Plaintext-Token
  if($token -notmatch '^ccpc_[0-9a-f]{64}$'){throw 'Protected local token format invalid.'}
  $payload='{"allowPaid":false,"allowProtected":false,"executionAuthorized":false}'
  try{
    $response=Invoke-RestMethod -Method Post -Uri ($gateway+'/health') -TimeoutSec 25 -Headers @{'x-command-center-worker-token'=$token} -ContentType 'application/json' -Body $payload
  }catch{
    throw 'COMMAND CENTER has not registered this worker yet, or the computer is offline. Upload the safe pairing-request JSON to ChatGPT first; do not share any passwords or tokens.'
  }finally { $token=$null }
  if($response.authorized -ne $true -or $response.workerId -ne $wid -or
     $response.scope -ne 'brain.respond.read_only' -or $response.companyBuildAuthorized -ne $false -or
     $response.paymentActionsAuthorized -ne $false){throw 'Cloud pairing response failed security verification.'}
  Write-Host 'VERIFIED: This Windows PC is paired with COMMAND CENTER for read-only AI responses.' -ForegroundColor Green
  Write-Host 'No company build, payment, or cloud-model permissions.'
  return $wid
}
function Save-Report {
  $wid=Require-Encrypted-Credential
  $digest=(Get-Content -LiteralPath $hashPath -Raw).Trim()
  if($digest -notmatch '^[0-9a-f]{64}$'){throw 'Local pairing digest invalid.'}
  $actual=Plaintext-Token
  $h=[System.Security.Cryptography.SHA256]::Create()
  try{$actualDigest=[BitConverter]::ToString($h.ComputeHash([Text.Encoding]::UTF8.GetBytes($actual))).Replace('-','').ToLowerInvariant()}
  finally{$h.Dispose();$actual=$null}
  if($actualDigest -ne $digest){throw 'Encrypted local token does not match the report fingerprint; stop without publishing it.'}
  $data=[ordered]@{
    schema='command-center-pc-pairing-request-v1'
    workerId=$wid
    tokenDigest=$digest
    label='Owner Windows 11 always-on AI workstation'
    modelId=$model
    scope='brain.respond.read_only'
    cloudInferenceAuthorized=$false
    companyExecutionAuthorized=$false
    paymentActionsAuthorized=$false
    tokenIncluded=$false
    requestGeneratedUtc=[DateTime]::UtcNow.ToString('o')
  }
  ($data|ConvertTo-Json -Depth 4) | Set-Content -LiteralPath $reportPath -Encoding UTF8
  Write-Host ''
  Write-Host 'PAIRING REQUEST READY' -ForegroundColor Green
  Write-Host 'Upload this one JSON file to your COMMAND CENTER ChatGPT conversation:'
  Write-Host $reportPath -ForegroundColor Cyan
  Write-Host 'It contains a SHA-256 FINGERPRINT, never the worker token, password, or API key.'
}
function Install-Source {
  $items=@(
    'clean-room\src\worker\pc-worker-cli.mjs',
    'clean-room\src\worker\pc-worker-supervisor.mjs',
    'clean-room\src\worker\pc-worker-transport.mjs',
    'clean-room\src\brain\pc-local-ollama.mjs',
    'clean-room\src\brain\pc-owner-inference-worker.mjs',
    'supabase\functions\command-center-execution\brain-readiness.mjs',
    'COMMAND_CENTER_PC_WINDOWS.ps1'
  )
  foreach($item in $items){
    $origin=Join-Path $PSScriptRoot $item
    if(-not(Test-Path -LiteralPath $origin)){throw ('Missing approved local worker file: '+$item)}
    $target=Join-Path $app $item
    $dir=Split-Path -Path $target -Parent
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    if(Test-Path -LiteralPath $target){
      if((Get-FileHash -LiteralPath $origin -Algorithm SHA256).Hash -ne
         (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash){
        throw 'An existing worker installation differs. Refusing to overwrite. No company records or remote state changed.'
      }
    } else {Copy-Item -LiteralPath $origin -Destination $target}
  }
}
function Background-Task {
  return Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
}
try {
 switch($Action){
  'Prepare' {
    $n=Require-Node
    Require-Model
    if(Test-Path -LiteralPath $credential){
      $null=Require-Encrypted-Credential
      Write-Host 'Existing encrypted worker credential found; preserving it, not creating a second one.'
      Save-Report
      break
    }
    if((Test-Path -LiteralPath $idPath) -or (Test-Path -LiteralPath $hashPath) -or (Test-Path -LiteralPath $modelPath)){
      throw 'Partial prior preparation found. Stopping rather than replacing any existing pairing identity.'
    }
    Install-Source
    $bytes=New-Object byte[] 32
    $rng=[System.Security.Cryptography.RandomNumberGenerator]::Create()
    try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
    $secret='ccpc_'+[BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
    $hasher=[System.Security.Cryptography.SHA256]::Create()
    try{$digest=[BitConverter]::ToString($hasher.ComputeHash([Text.Encoding]::UTF8.GetBytes($secret))).Replace('-','').ToLowerInvariant()}
    finally{$hasher.Dispose()}
    $wid=[guid]::NewGuid().ToString('D').ToLowerInvariant()
    $secure=ConvertTo-SecureString -String $secret -AsPlainText -Force
    $protected=ConvertFrom-SecureString -SecureString $secure
    $protected|Set-Content -LiteralPath $credential -Encoding ASCII -NoNewline
    $wid|Set-Content -LiteralPath $idPath -Encoding ASCII -NoNewline
    $digest|Set-Content -LiteralPath $hashPath -Encoding ASCII -NoNewline
    $model|Set-Content -LiteralPath $modelPath -Encoding ASCII -NoNewline
    $n|Set-Content -LiteralPath $nodePathFile -Encoding UTF8 -NoNewline
    $secret=$null
    Save-Report
    break
  }
  'Verify' {$null=Verify-Cloud; break}
  'EnableBackground' {
    $null=Verify-Cloud
    $current=(Background-Task)
    if($current){throw 'The background task already exists. It was not replaced; use Status to inspect it.'}
    $installedScript=Join-Path $app 'COMMAND_CENTER_PC_WINDOWS.ps1'
    if(-not(Test-Path -LiteralPath $installedScript)){throw 'Installed worker script missing.'}
    $command=(Get-Command powershell.exe).Source
    $params='-NoLogo -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "'+$installedScript+'" -Action Run'
    $scheduled=New-ScheduledTaskAction -Execute $command -Argument $params -WorkingDirectory $app
    $username=[System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $trigger=New-ScheduledTaskTrigger -AtLogOn -User $username
    $principal=New-ScheduledTaskPrincipal -UserId $username -LogonType Interactive -RunLevel Limited
    $settings=New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)
    Register-ScheduledTask -TaskName $taskName -Action $scheduled -Trigger $trigger -Principal $principal -Settings $settings -Description 'Owner-authorized COMMAND CENTER read-only local AI worker'|Out-Null
    Start-ScheduledTask -TaskName $taskName
    Write-Host 'BACKGROUND WORKER ENABLED for your signed-in Windows user.' -ForegroundColor Green
    Write-Host 'It restarts at Windows logon; no public listener, company build, or payment access.'
    Write-Host 'Status and latest event log: '
    Write-Host $logPath
    break
  }
  'Run' {
    $null=Require-Encrypted-Credential
    $n=Require-Node
    $token=Plaintext-Token
    if($token -notmatch '^ccpc_[0-9a-f]{64}$'){throw 'Worker token is invalid.'}
    $env:CC_PC_LOCAL_MODEL=(Get-Content -LiteralPath $modelPath -Raw).Trim()
    $env:CC_PC_WORKER_TOKEN=$token
    $token=$null
    $cli=Join-Path $app 'clean-room\src\worker\pc-worker-cli.mjs'
    if(-not(Test-Path -LiteralPath $cli)){throw 'Worker source missing from installed AppData path.'}
    Write-Host 'Starting read-only local AI worker. No company builds/payments authorized.'
    try{
      while($true){
        if(Test-Path -LiteralPath $logPath){
          if((Get-Item -LiteralPath $logPath).Length -gt 5242880){Clear-Content -LiteralPath $logPath}
        }
        & $n $cli *>> $logPath
        Start-Sleep -Seconds 90
      }
    }finally{
      Remove-Item Env:\CC_PC_WORKER_TOKEN -ErrorAction SilentlyContinue
      Remove-Item Env:\CC_PC_LOCAL_MODEL -ErrorAction SilentlyContinue
    }
  }
  'Status' {
    $null=Require-Encrypted-Credential
    $task=Background-Task
    if($task){Write-Host ('Task Scheduler: '+$task.State)}else{Write-Host 'Task Scheduler: not installed'}
    try{$null=Verify-Cloud}catch{Write-Host 'Cloud pairing not yet verified.'}
    if(Test-Path -LiteralPath $logPath){
      Write-Host 'Latest safe event messages:'
      Get-Content -LiteralPath $logPath -Tail 6
    }
    break
  }
  'DisableBackground' {
    $task=Background-Task
    if($task){
      Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
      Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
      Write-Host 'Local background task stopped and removed.' -ForegroundColor Green
    }else{Write-Host 'No scheduled background task exists.'}
    Write-Host 'The cloud-side worker registration is NOT revoked by this action.'
    break
  }
 }
} catch {
 Write-Host ('SETUP STOPPED: '+$_.Exception.Message) -ForegroundColor Red
 exit 1
}
