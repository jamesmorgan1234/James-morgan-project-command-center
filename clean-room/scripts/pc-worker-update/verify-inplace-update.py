"""Run isolated file/update/recovery checks under an available PowerShell runtime.

Scheduler/CIM and Ollama are fixtures. These are not native Windows or live-PC
acceptance results. Actual source modules and file copies are exercised.
"""
import argparse,base64,hashlib,importlib.util,json,os,pathlib,re,shutil,subprocess,sys,tempfile
sys.dont_write_bytecode=True
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('cc_update_package',HERE/'build-package.py')
package=importlib.util.module_from_spec(spec);spec.loader.exec_module(package)
outer_spec=importlib.util.spec_from_file_location('cc_inplace_update',HERE/'build-inplace-update.py')
outer_builder=importlib.util.module_from_spec(outer_spec);outer_spec.loader.exec_module(outer_builder)
def verify(pwsh):
    manifest,contents=package.reviewed_payload(True)
    manifest['candidateState']='source-committed' # isolated fixture, not a release
    results=[]
    with tempfile.TemporaryDirectory(prefix='cc-ps-update-') as work:
        root=pathlib.Path(work)
        template=root/'outer-template.ps1';outer_builder.build(template,True)
        outer_source=template.read_text()
        embedded=re.search(r"UPDATE_MANIFEST.json'\),\[Convert\]::FromBase64String\('([^']+)'\)",outer_source)
        assert embedded,'Embedded manifest not found'
        shim=root/'ollama-fixture.mjs'
        shim.write_text("""globalThis.fetch=async url=>{
if(!String(url).startsWith('http://127.0.0.1:11434/'))throw Error('Unexpected isolated network destination');
return {ok:true,json:async()=>String(url).endsWith('/api/tags')?{models:[{name:'qwen3:4b-instruct',digest:'a'.repeat(64),details:{}}]}:{model:'qwen3:4b-instruct',done:true,message:{content:'ready'}}};
};""")
        for scenario in ['success','copy_failure','corrupted_payload','disabled_task','already_installed','outer_success','outer_failure']:
            case=root/scenario;payload=case/'payload';appdata=case/'appdata';base=appdata/'COMMAND_CENTER_PC_WORKER';app=base/'app'
            app.mkdir(parents=True);payload.mkdir(parents=True)
            m=json.loads(json.dumps(manifest));original={}
            for i,entry in enumerate(m['originalFiles']):
                text=f'// isolated prior source {i}\n'.encode();entry['sha256']=hashlib.sha256(text).hexdigest()
                path=app/entry['path'];path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(text);original[entry['path']]=text
            for name,data in contents.items():
                path=payload/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            if scenario=='already_installed':
                for name,data in contents.items():
                    path=app/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
            if scenario=='corrupted_payload':(payload/m['files'][0]['path']).write_text('corrupt')
            (case/'UPDATE_MANIFEST.json').write_text(json.dumps(m))
            if scenario.startswith('outer_'):
                fixture_manifest=base64.b64encode(json.dumps(m).encode()).decode()
                (case/'INPLACE.ps1').write_text(outer_source.replace(embedded.group(1),fixture_manifest))
            shutil.copyfile(HERE/'UPDATE_EXISTING_WORKER.ps1',case/'UPDATE_EXISTING_WORKER.ps1')
            (base/'worker-id.txt').write_text(m['workerId']);(base/'node-path.txt').write_text(shutil.which('node'));(base/'model-name.txt').write_text('qwen3:4b-instruct')
            # Sentinel is synthetic; no real credential is created or read.
            (base/'worker-token.dpapi').write_text('ISOLATED-CREDENTIAL-SENTINEL')
            (app/'COMMAND_CENTER_PC_WINDOWS.ps1').write_text('# isolated launcher sentinel')
            harness=case/'harness.ps1'
            harness.write_text("""$ErrorActionPreference='Stop'
$global:CCFixtureStopped=$false;$global:CCFixtureCopiedFailure=$false;$global:CCFixtureStops=0;$global:CCFixtureStarts=0
function Get-ScheduledTask {param($TaskPath,$TaskName,$ErrorAction)
 return [pscustomobject]@{State='Running';Settings=[pscustomobject]@{Enabled=($env:CC_TEST_SCENARIO -ne 'disabled_task')};Actions=@([pscustomobject]@{Arguments=(Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER/app/COMMAND_CENTER_PC_WINDOWS.ps1')})}}
function Export-ScheduledTask {param($TaskPath,$TaskName) return '<unchanged-task-fixture />'}
function Get-CimInstance {param($ClassName) return @()}
function Stop-ScheduledTask {param($TaskPath,$TaskName) $global:CCFixtureStopped=$true;$global:CCFixtureStops++}
function Start-ScheduledTask {param($TaskPath,$TaskName) $global:CCFixtureStarts++}
function Copy-Item {param($LiteralPath,$Destination,[switch]$Force)
 if($env:CC_TEST_SCENARIO -in @('copy_failure','outer_failure') -and $global:CCFixtureStopped -and -not $global:CCFixtureCopiedFailure -and $Destination.StartsWith((Join-Path $env:LOCALAPPDATA 'COMMAND_CENTER_PC_WORKER/app'))){$global:CCFixtureCopiedFailure=$true;throw 'Isolated copy failure'}
 Microsoft.PowerShell.Management\\Copy-Item -LiteralPath $LiteralPath -Destination $Destination -Force:$Force
}
try {
 if($env:CC_TEST_SCENARIO.StartsWith('outer_')){& (Join-Path $PSScriptRoot 'INPLACE.ps1')}
 else{& (Join-Path $PSScriptRoot 'UPDATE_EXISTING_WORKER.ps1')}
}finally{
 @{stops=$global:CCFixtureStops;starts=$global:CCFixtureStarts}|ConvertTo-Json -Compress|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'scheduler.json')
}
""")
            temporary=case/'staging';temporary.mkdir();(temporary/'unrelated.txt').write_text('preserve')
            env={**os.environ,'LOCALAPPDATA':str(appdata),'NODE_OPTIONS':'--import '+str(shim),'CC_TEST_SCENARIO':scenario,'TMPDIR':str(temporary)}
            ran=subprocess.run([pwsh,'-NoLogo','-NoProfile','-File',str(harness)],env=env,text=True,capture_output=True,timeout=60)
            text=ran.stdout+ran.stderr
            assert (base/'worker-token.dpapi').read_text()=='ISOLATED-CREDENTIAL-SENTINEL'
            assert (app/'COMMAND_CENTER_PC_WINDOWS.ps1').read_text()=='# isolated launcher sentinel'
            if scenario in ['success','outer_success']:
                assert ran.returncode==0,text
                assert 'source updated and locally tested' in text,text
                for name,data in contents.items():assert (app/name).read_bytes()==data,name
                result=json.loads((base/'CLIENT_UPDATE_RESULT.json').read_text(encoding='utf-8-sig'))
                assert result['taskDefinitionPreserved'] and not result['fullBrainActivationClaimed']
            elif scenario=='already_installed':assert 'already installed' in text,text
            else:
                assert 'UPDATE STOPPED:' in text,text
                for name,data in original.items():assert (app/name).read_bytes()==data,name
                for name in contents:
                    if name not in original:assert not (app/name).exists(),name
            # exit from the child script can bypass later harness output on some
            # hosts; file-state assertions above remain the recovery authority.
            if (case/'scheduler.json').exists():
                state=json.loads((case/'scheduler.json').read_text(encoding='utf-8-sig'))
                if scenario in ['success','outer_success']:assert state=={'starts':1,'stops':1},state
                elif scenario in ['copy_failure','outer_failure']:assert state=={'starts':1,'stops':1},state
                else:assert state=={'starts':0,'stops':0},state
            assert [p.name for p in temporary.iterdir()]==['unrelated.txt'],'Update staging did not clean up'
            results.append({'scenario':scenario,'passed':True})
    return {'environment':'Linux PowerShell with scheduler/CIM/Ollama fixtures','nativeWindowsVerified':False,'payloadFiles':len(contents),'scenarios':results}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('pwsh');a=p.parse_args();print(json.dumps(verify(a.pwsh)))
