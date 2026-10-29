import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyConversationIntent} from '../dist/brain/index.js';
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
