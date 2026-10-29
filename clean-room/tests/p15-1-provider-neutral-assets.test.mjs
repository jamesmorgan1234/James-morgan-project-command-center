import test from 'node:test';
import assert from 'node:assert/strict';
import {AssetRegistry,ProviderRegistry} from '../dist/data/index.js';

function storageProvider(key,version=1){
  return {
    key,
    version,
    enabled:true,
    authMode:'custom_ref',
    capabilities:['storage:asset'],
    scopes:['assets:read','assets:write'],
    freshnessSeconds:60,
    cost:'free',
    health:'available',
    verification:'source',
    failureMode:'fail_closed'
  };
}

test('CCR-02160 provider-specific file storage remains replaceable while canonical asset identity stays authoritative',()=>{
  const assets=new AssetRegistry();
  const canonical={
    id:'asset:provider-independent',
    ownerId:'owner-1',
    projectId:'prj_command-center',
    name:'canonical-artifact.pdf',
    sha256:'a'.repeat(64),
    version:1,
    sensitivity:'internal',
    originalState:'available',
    approvalState:'approved',
    sourceRef:'canonical:artifact-pointer',
    mediaType:'application/pdf',
    createdAt:'2026-10-29T00:00:00Z',
    updatedAt:'2026-10-29T00:00:00Z'
  };
  assets.register(canonical);
  const before=JSON.stringify(assets.get(canonical.id));

  const providers=new ProviderRegistry();
  providers.register(storageProvider('provider:storage-a'));
  assert.equal(providers.forCapability('storage:asset')[0].key,'provider:storage-a');
  providers.remove('provider:storage-a',1);
  providers.register(storageProvider('provider:storage-b'));
  assert.equal(providers.forCapability('storage:asset')[0].key,'provider:storage-b');

  assert.equal(JSON.stringify(assets.get(canonical.id)),before);
  assert.equal(assets.get(canonical.id).id,canonical.id);
  assert.equal(assets.get(canonical.id).sha256,canonical.sha256);
  assert.equal(before.includes('provider:storage-a'),false);
  assert.equal(before.includes('provider:storage-b'),false);
});
