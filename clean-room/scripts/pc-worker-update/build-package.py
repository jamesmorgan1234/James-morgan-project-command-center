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
]
def build(output, allow_working_tree=False):
    dirty = subprocess.check_output(['git','status','--porcelain','--',*FILES,str(HERE.relative_to(ROOT))],cwd=ROOT).decode().strip()
    if dirty and not allow_working_tree:
        raise SystemExit('Commit and verify source before publishing the worker update package.')
    head = subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT).decode().strip()
    recovered = json.loads((ROOT/'clean-room/evidence/brain-activation/installed-worker-recovery-verification.json').read_text())
    manifest = dict(schema='cc-existing-pc-worker-update-v1',sourceCommit=head,
        candidateState='working-tree-unapproved' if dirty else 'source-committed',
        workerId='737f5e7c-3884-4c61-81ac-634bdfc4828f',
        files=[dict(path=p,sha256=hashlib.sha256((ROOT/p).read_bytes()).hexdigest()) for p in FILES],
        originalFiles=[dict(path=p['path'],sha256=p['sha256']) for p in recovered['files']],
        pairingRecreated=False,spendingAuthorized=False,companyBuildAuthorized=False)
    output = pathlib.Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for p in FILES: archive.writestr('payload/'+p,(ROOT/p).read_bytes())
        for p in ['UPDATE_EXISTING_WORKER.cmd','UPDATE_EXISTING_WORKER.ps1','README.txt']:
            archive.writestr(p,(HERE/p).read_bytes())
        archive.writestr('UPDATE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(dict(package=str(output),files=11,sha256=hashlib.sha256(output.read_bytes()).hexdigest(),candidateState=manifest['candidateState'],sourceCommit=head)))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('output');parser.add_argument('--allow-working-tree',action='store_true')
    args=parser.parse_args();build(args.output,args.allow_working_tree)
