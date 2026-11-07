"""Package only exact reviewed source files. Never read owner credential files."""
import argparse, hashlib, json, pathlib, subprocess, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
FILES = [
 'clean-room/src/worker/pc-worker-cli.mjs',
 'clean-room/src/worker/pc-worker-supervisor.mjs',
 'clean-room/src/worker/pc-worker-transport.mjs',
 'clean-room/src/brain/pc-local-ollama.mjs',
 'clean-room/src/brain/pc-owner-inference-worker.mjs',
 'clean-room/src/brain/pc-brain-readiness.mjs',
 'clean-room/src/brain/pc-activation-contract.mjs',
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
 'clean-room/src/brain/tool-runtime.mjs',
 'clean-room/src/brain/tool-access.mjs',
]
COMPILED = {f'clean-room/src/brain/{name}.mjs':ROOT/f'clean-room/dist/brain/{name}.js' for name in ['tool-runtime','tool-access']}
TS_SOURCES = ['clean-room/src/brain/tool-runtime.ts','clean-room/src/brain/tool-access.ts']
BASELINE = 'clean-room/evidence/brain-activation/installed-tool-client-baseline.json'
def reviewed_payload(allow_working_tree=False):
    dirty = subprocess.check_output(['git','status','--porcelain','--',*FILES,*TS_SOURCES,BASELINE,str(HERE.relative_to(ROOT))],cwd=ROOT).decode().strip()
    if dirty and not allow_working_tree:
        raise SystemExit('Commit and verify source before publishing the worker update package.')
    head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip()
    subprocess.run(['npm','run','build:modules'],cwd=ROOT/'clean-room',check=True,capture_output=True)
    contents={p:(COMPILED.get(p,ROOT/p)).read_bytes() for p in FILES}
    # The installed app has no package.json. Keep its entire dependency closure
    # explicitly ESM on every supported Node 22 minor version.
    contents['clean-room/src/brain/tool-runtime.mjs']=contents['clean-room/src/brain/tool-runtime.mjs'].replace(b'./tool-access.js',b'./tool-access.mjs')
    contents['clean-room/src/worker/pc-tool-execution-lane.mjs']=contents['clean-room/src/worker/pc-tool-execution-lane.mjs'].replace(b'../brain/tool-runtime.js',b'../brain/tool-runtime.mjs')
    recovered = json.loads((ROOT/BASELINE).read_text())
    if len(FILES)!=19 or len(recovered['files'])!=14 or recovered['sourceCommit']!='41f46935f8524c47355199ca02651b5d4ecc6dce' or recovered['workerId']!='737f5e7c-3884-4c61-81ac-634bdfc4828f':
        raise SystemExit('Exact installed 14-file tool-client baseline is required')
    if not all(f['path'] in FILES and len(f['sha256'])==64 for f in recovered['files']):
        raise SystemExit('Installed source manifest contains an invalid path or hash')
    manifest = dict(schema='cc-existing-pc-worker-update-v1',sourceCommit=head,
        candidateState='working-tree-unapproved' if dirty else 'source-committed',
        workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f',
        files=[dict(path=p,sha256=hashlib.sha256(contents[p]).hexdigest()) for p in FILES],
        originalFiles=[dict(path=p['path'],sha256=p['sha256']) for p in recovered['files']],
        installedBaselineCommit=recovered['sourceCommit'],
        pairingRecreated=False,spendingAuthorized=False,companyBuildAuthorized=False)
    return manifest,contents
def build(output, allow_working_tree=False):
    manifest,contents=reviewed_payload(allow_working_tree)
    head=manifest['sourceCommit']
    output = pathlib.Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for p in FILES: archive.writestr('payload/'+p,contents[p])
        for p in ['UPDATE_EXISTING_WORKER.cmd','UPDATE_EXISTING_WORKER.ps1','README.txt']:
            archive.writestr(p,(HERE/p).read_bytes())
        archive.writestr('UPDATE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(dict(package=str(output),files=len(FILES)+4,sha256=hashlib.sha256(output.read_bytes()).hexdigest(),candidateState=manifest['candidateState'],sourceCommit=head)))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('output');parser.add_argument('--allow-working-tree',action='store_true')
    args=parser.parse_args();build(args.output,args.allow_working_tree)
