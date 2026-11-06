"""Build one hash-verifiable, self-contained update; no ZIP/extraction by owner."""
import argparse,base64,hashlib,importlib.util,json,pathlib,sys
sys.dont_write_bytecode=True
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('cc_update_package',HERE/'build-package.py')
package=importlib.util.module_from_spec(spec);spec.loader.exec_module(package)

def build(output,allow_working_tree=False,source_commit=None):
    manifest,contents=package.reviewed_payload(allow_working_tree)
    if source_commit:
        if len(source_commit)!=40 or any(c not in '0123456789abcdef' for c in source_commit):
            raise SystemExit('Immutable source commit required')
        manifest['sourceCommit']=source_commit
    updater=(HERE/'UPDATE_EXISTING_WORKER.ps1').read_bytes()
    updater_hash=hashlib.sha256(updater).hexdigest()
    encoded={p:base64.b64encode(data).decode() for p,data in contents.items()}
    entries='\n'.join("  '"+p+"'='"+encoded[p]+"'" for p in encoded)
    manifest_data=base64.b64encode((json.dumps(manifest,indent=2)+'\n').encode()).decode()
    updater_data=base64.b64encode(updater).decode()
    script="""# COMMAND CENTER existing-client update. Exact committed code; no ZIP.
[CmdletBinding()]
param()
$ErrorActionPreference='Stop'
$stage=Join-Path ([IO.Path]::GetTempPath()) ('cc-existing-client-'+[guid]::NewGuid().ToString('N'))
$resultCode=1
try {
 $null=New-Item -ItemType Directory -Path $stage
 $entries=@{
__ENTRIES__
 }
 foreach($relative in $entries.Keys){
  if($relative -notmatch '^clean-room/src/(worker|brain)/[a-z0-9-]+\\.mjs$'){throw 'Embedded source path invalid.'}
  $path=Join-Path (Join-Path $stage 'payload') ($relative.Replace('/',[IO.Path]::DirectorySeparatorChar))
  $null=New-Item -ItemType Directory -Path (Split-Path $path) -Force
  [IO.File]::WriteAllBytes($path,[Convert]::FromBase64String($entries[$relative]))
 }
 [IO.File]::WriteAllBytes((Join-Path $stage 'UPDATE_MANIFEST.json'),[Convert]::FromBase64String('__MANIFEST__'))
 $entry=Join-Path $stage 'UPDATE_EXISTING_WORKER.ps1'
 [IO.File]::WriteAllBytes($entry,[Convert]::FromBase64String('__UPDATER__'))
 if((Get-FileHash -LiteralPath $entry -Algorithm SHA256).Hash.ToLowerInvariant() -ne '__UPDATER_HASH__'){throw 'Embedded updater hash mismatch.'}
 # Local bytes just decoded from the exact outer script verified by its caller.
 & $entry
 $resultCode=$LASTEXITCODE
 if($null -eq $resultCode){$resultCode=0}
}finally {
 if(Test-Path -LiteralPath $stage){Remove-Item -LiteralPath $stage -Recurse -Force}
}
if($resultCode -ne 0){throw 'Existing client update did not complete. See the UPDATE STOPPED reason above.'}
"""
    script=script.replace('__ENTRIES__',entries).replace('__MANIFEST__',manifest_data).replace('__UPDATER__',updater_data).replace('__UPDATER_HASH__',updater_hash)
    target=pathlib.Path(output);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(script,encoding='utf-8',newline='\n')
    return {'file':str(target),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size,'payloadFiles':len(contents),'sourceCommit':manifest['sourceCommit'],'candidateState':manifest['candidateState'],'zipRequired':False}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('output');p.add_argument('--allow-working-tree',action='store_true');p.add_argument('--source-commit');a=p.parse_args()
    print(json.dumps(build(a.output,a.allow_working_tree,a.source_commit)))
