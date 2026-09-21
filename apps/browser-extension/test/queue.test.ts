import assert from 'node:assert/strict';
import test from 'node:test';
import { DurableEventQueue } from '../src/queue.ts';

function memoryStore(seed: Record<string, unknown> = {}) {
  const state = { ...seed };
  return { state, get: async (key:string) => ({ [key]: state[key] }), set: async (value:Record<string,unknown>) => { Object.assign(state,value); } };
}

test('queue survives recreation and removes only acknowledged events', async () => {
  const store=memoryStore(); const first=new DurableEventQueue(store,()=>1000,()=>0);
  await first.enqueue({id:'one',sessionId:'s1',idempotencyKey:'i1',payload:{state:'success'}});
  const second=new DurableEventQueue(store,()=>1000,()=>0); const sent:string[]=[];
  await second.drain(async item=>{sent.push(item.id);});
  assert.deepEqual(sent,['one']); assert.equal((await second.list()).length,0);
});

test('queue deduplicates local events and backs off retryable failures', async () => {
  const store=memoryStore(); const queue=new DurableEventQueue(store,()=>2000,()=>0);
  const item={id:'same',sessionId:'s1',idempotencyKey:'i1',payload:{}}; await queue.enqueue(item); await queue.enqueue(item);
  await queue.drain(async()=>{throw Object.assign(new Error('offline'),{status:503});});
  const remaining=await queue.list(); assert.equal(remaining.length,1); assert.equal(remaining[0].attempts,1); assert.equal(remaining[0].nextAttemptAt,12000);
});

test('queue pauses without dropping events when device session is rejected', async () => {
  const store=memoryStore(); const queue=new DurableEventQueue(store,()=>3000,()=>0);
  await queue.enqueue({id:'one',sessionId:'s1',idempotencyKey:'i1',payload:{}}); await queue.enqueue({id:'two',sessionId:'s1',idempotencyKey:'i2',payload:{}});
  const result=await queue.drain(async()=>{throw Object.assign(new Error('revoked'),{status:401});});
  assert.equal(result.paused,true); assert.equal((await queue.list()).length,2);
});
