COMMAND CENTER - existing Windows worker client update

This updates the already paired worker only. It does not install Node/Ollama,
create a new pairing, read a credential/token file, replace the scheduled Task,
start a company build, deploy a service, or grant tool/account permissions.

After COMMAND CENTER has completed candidate verification:
1. Extract this entire ZIP into one folder.
2. Double-click UPDATE_EXISTING_WORKER.cmd once.

The updater verifies the exact recovered original source and all new payload
hashes; tests local inference before stopping the existing running worker;
backs up only code; replaces verified code; restarts that same Task; and
restores original code if the copy fails. A stopped/disabled task is not enabled
or restarted. Existing credential, ID, node-path and model files are preserved.
The updater does not change PowerShell execution policy. If Windows refuses it,
stop there and report the refusal; do not bypass the policy.

A successful local update is not evidence that all specialist Brains are active.
COMMAND CENTER must verify real specialist responses, task/tool execution,
permissions, isolation, stop/recovery, and canonical evidence separately.
