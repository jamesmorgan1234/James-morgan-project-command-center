import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldQueuePcBrainResponse} from '../src/brain/pc-scoped-route.mjs';

const validated = ['project:company:future:014','edge-finder'];
test('central Brain keeps its existing PC read-only route',()=>{
  assert.equal(shouldQueuePcBrainResponse(undefined,[],{}),true);
  assert.equal(shouldQueuePcBrainResponse(null,[],{}),true);
});
test('verified project-scoped diagnostic route may queue despite general operational blockers',()=>{
  assert.equal(shouldQueuePcBrainResponse('project:company:future:014',validated,{'project:company:future:014':'unavailable'}),true);
  assert.equal(shouldQueuePcBrainResponse('edge-finder',validated,{}),true);
});
test('unverified or different company cannot gain a PC queue by passing any other project',()=>{
  assert.equal(shouldQueuePcBrainResponse('project:company:future:013',validated,{}),false);
  assert.equal(shouldQueuePcBrainResponse('another-project',validated,{}),false);
  assert.equal(shouldQueuePcBrainResponse('',validated,{}),false);
  assert.equal(shouldQueuePcBrainResponse('   ',validated,{}),false);
});
test('old generally-ready route is preserved without declaring unverified projects available',()=>{
  assert.equal(shouldQueuePcBrainResponse('existing',[],{existing:'available'}),true);
  assert.equal(shouldQueuePcBrainResponse('existing',[],{existing:'unavailable'}),false);
});
test('malformed optional evidence fails closed',()=>{
  assert.equal(shouldQueuePcBrainResponse('project:company:future:014',null,{}),false);
  assert.equal(shouldQueuePcBrainResponse('project:company:future:014',{},{}),false);
  assert.equal(shouldQueuePcBrainResponse('project:company:future:014',[],null),false);
});
