import test from 'node:test';
import assert from 'node:assert/strict';
import {BrainMemoryLedger,classifyConversationIntent} from '../dist/brain/index.js';
import {PortabilityCenter} from '../dist/data/index.js';

const turn={
  id:'cnv_portable-turn',
  ownerId:'owner-1',
  projectId:'prj_command-center',
  role:'owner',
  text:'What is the next verified step?',
  createdAt:'2026-10-29T00:00:00Z',
  evidenceRefs:['evd_portable-conversation']
};

const memory={
  id:'memory:portable-structured',
  ownerId:'owner-1',
  projectId:'prj_command-center',
  kind:'rule',
  version:1,
  state:'current',
  value:{rule:'Preserve verified work and fail closed on uncertainty.'},
  confidence:1,
  sensitivity:'internal',
  sourceRefs:['source:canonical-memory'],
  recordedAt:'2026-10-29T00:02:00Z'
};

test('CCR-02151 canonical conversation record exports and stages for fresh import without losing semantics',()=>{
  const portable={
    id:turn.id,
    entityType:'conversation-turn',
    version:1,
    contentHash:'conversation:portable-turn:v1',
    sensitivity:'internal',
    provenanceRefs:['source:brain-conversation'],
    data:turn
  };
  const manifest=new PortabilityCenter().export([portable]);
  const staged=new PortabilityCenter().stageImport('import:conversation-turn',manifest.records,[]);
  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.deepEqual(staged.results,[{id:turn.id,disposition:'create',reason:'new_id'}]);
  const recovered=manifest.records[0].data;
  assert.deepEqual(recovered,turn);
  assert.deepEqual(classifyConversationIntent(recovered.text),{intent:'question',protectedActionPossible:false});
});

test('CCR-02152 canonical structured memory exports and is accepted by a fresh memory ledger after import staging',()=>{
  const sourceLedger=new BrainMemoryLedger();
  sourceLedger.append(memory);
  assert.deepEqual(sourceLedger.current(memory.ownerId,memory.projectId),[memory]);

  const portable={
    id:memory.id,
    entityType:'brain-memory',
    version:memory.version,
    contentHash:'memory:portable-structured:v1',
    sensitivity:memory.sensitivity,
    provenanceRefs:memory.sourceRefs,
    data:memory
  };
  const manifest=new PortabilityCenter().export([portable]);
  const staged=new PortabilityCenter().stageImport('import:structured-memory',manifest.records,[]);
  assert.equal(staged.canApplyWithoutOverwrite,true);
  assert.deepEqual(staged.results,[{id:memory.id,disposition:'create',reason:'new_id'}]);

  const freshLedger=new BrainMemoryLedger();
  const recovered=manifest.records[0].data;
  freshLedger.append(recovered);
  const current=freshLedger.current(memory.ownerId,memory.projectId);
  assert.equal(current.length,1);
  assert.deepEqual(current[0],memory);
  assert.deepEqual(current[0].value,memory.value);
});
