COMMAND CENTER - SECURE PC PAIRING (read-only AI worker)
=======================================================

Your local model qwen3:4b-instruct was verified on November 5, 2026.
This package does NOT install a new AI model, sign into any accounts,
use cloud AI, build companies, move money, or request passwords.

FIRST: Keep Ollama running on your Windows 11 computer.

1. Double-click 1_PREPARE_SECURE_PAIRING_WINDOWS.cmd
   It verifies Node.js and the local model. Your PC creates a new secret,
   encrypted for YOUR Windows account using DPAPI. The secret is NOT
   printed in the console and is NOT included in the pairing report.

2. Locate COMMAND_CENTER_PC_PAIRING_REQUEST.json in this same extracted folder.
   Upload that JSON to your COMMAND CENTER ChatGPT conversation.
   It contains a cryptographic fingerprint, not the secret.

3. ChatGPT registers that fingerprint for the existing COMMAND CENTER
   Supabase project, scoped ONLY to read-only Brain responses.
   Do not proceed to step 4 until ChatGPT confirms registration.

4. Double-click 2_VERIFY_AND_ENABLE_BACKGROUND_WINDOWS.cmd
   It checks the live cloud pairing without claiming any tasks.
   Only after verification, it creates and starts a per-user Windows
   Task Scheduler task. No Windows admin rights should be needed.

5. Upload the resulting photo or describe the status shown if a step fails.
   You can optionally double-click 3_CHECK_WORKER_STATUS_WINDOWS.cmd.
   To stop and remove the local auto-start task, run 4_DISABLE_BACKGROUND_WINDOWS.cmd.

Installed worker code and encrypted credential reside in:
  %LOCALAPPDATA%\COMMAND_CENTER_PC_WORKER

The worker uses an outbound-only HTTPS connection to your existing
Supabase project and Ollama at 127.0.0.1:11434. It cannot execute
company builds, push GitHub code, or make any payment actions.

The worker starts at Windows user logon. It remains active when you
lock Windows or close the laptop lid ONLY if your computer stays awake,
your Windows session remains signed in, and Ollama is running.

Background polling is limited to one minute per check by default to
conserve free usage. No paid API fallback. You are free to stop it.

IMPORTANT: Never upload the file named worker-token.dpapi. Never paste
worker secrets or passwords into ChatGPT. Only the pairing-request JSON.
