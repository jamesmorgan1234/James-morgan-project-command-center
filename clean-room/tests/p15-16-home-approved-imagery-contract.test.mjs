import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const APPROVED_ASSET = join(ROOT, 'public', 'assets', 'approved-projects-visual-reference.png');
const EXPECTED_GIT_BLOB_SHA = '0ef8623b748d3a4a33f15ab3631cab5c1fb9027a';
const EXPECTED_ASSET_SIZE = 2040367;

function gitBlobSha(buffer) {
  return createHash('sha1')
    .update(`blob ${buffer.length}\0`)
    .update(buffer)
    .digest('hex');
}

test('P15.16 Home/dashboard cards use the preserved approved project imagery', () => {
  const index = readFileSync(join(ROOT, 'public', 'index.html'), 'utf8');
  const css = readFileSync(join(ROOT, 'public', 'home-approved-imagery.css'), 'utf8');
  const browser = readFileSync(join(ROOT, 'src', 'runtime', 'browser.ts'), 'utf8');
  const asset = readFileSync(APPROVED_ASSET);

  assert.equal(asset.length, EXPECTED_ASSET_SIZE);
  assert.equal(gitBlobSha(asset), EXPECTED_GIT_BLOB_SHA);
  assert.match(index, /<link rel="stylesheet" href="\/home-approved-imagery\.css">/);
  assert.match(browser, /home-primary-card/);
  assert.match(css, /\.home-primary-card\s*\{[\s\S]*url\('\/assets\/approved-projects-visual-reference\.png'\)/);
  assert.doesNotMatch(css, /data:image|https?:\/\//i);
});
