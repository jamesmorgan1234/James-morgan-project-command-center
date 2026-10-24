import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const scriptUrl = new URL("../scripts/category15-pwa-lifecycle.mjs", import.meta.url);

test("P15.14 lifecycle harness uses explicit loopback DevTools probing instead of Chrome profile-file discovery", async () => {
  const source = await readFile(scriptUrl, "utf8");
  assert.match(source, /createServer/);
  assert.match(source, /reserveLoopbackPort/);
  assert.match(source, /--remote-debugging-address=127\.0\.0\.1/);
  assert.match(source, /--remote-debugging-port=\$\{debugPort\}/);
  assert.match(source, /127\.0\.0\.1:\$\{debugPort\}\/json\/version/);
  assert.doesNotMatch(source, /DevToolsActivePort/);
  assert.match(source, /Initial service-worker install\/cache proof failed/);
  assert.match(source, /Offline cached navigation was not served/);
  assert.match(source, /Explicit waiting-worker activation\/two-cache retention failed/);
});
