export interface QueueStore { get(key: string): Promise<Record<string, unknown>>; set(value: Record<string, unknown>): Promise<void>; }
export interface QueueEnvelope { id: string; sessionId: string; idempotencyKey: string; payload: Record<string, unknown>; createdAt: number; attempts: number; nextAttemptAt: number; }

const KEY = 'topupEventQueue';
const MAX_ITEMS = 100;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export class DurableEventQueue {
  private draining = false;
  private readonly store: QueueStore;
  private readonly now: () => number;
  private readonly random: () => number;
  constructor(store: QueueStore, now = () => Date.now(), random = Math.random) { this.store = store; this.now = now; this.random = random; }
  async list(): Promise<QueueEnvelope[]> { const value = await this.store.get(KEY); return Array.isArray(value[KEY]) ? value[KEY] as QueueEnvelope[] : []; }
  async enqueue(input: Omit<QueueEnvelope, 'createdAt' | 'attempts' | 'nextAttemptAt'>): Promise<void> {
    const now = this.now();
    const items = (await this.list()).filter(item => now - item.createdAt < MAX_AGE_MS && item.id !== input.id);
    items.push({ ...input, createdAt: now, attempts: 0, nextAttemptAt: now });
    await this.store.set({ [KEY]: items.slice(-MAX_ITEMS) });
  }
  async drain(send: (item: QueueEnvelope) => Promise<void>): Promise<{ sent: number; paused: boolean }> {
    if (this.draining) return { sent: 0, paused: false };
    this.draining = true;
    let sent = 0; let paused = false;
    try {
      const now = this.now(); const source = (await this.list()).filter(item => now - item.createdAt < MAX_AGE_MS); const remaining: QueueEnvelope[] = [];
      for (let index = 0; index < source.length; index += 1) {
        const item = source[index];
        if (item.nextAttemptAt > now) { remaining.push(item); continue; }
        try { await send(item); sent += 1; }
        catch (error: any) {
          if (error?.status === 401 || error?.status === 403) { remaining.push(item, ...source.slice(index + 1)); paused = true; break; }
          const attempts = item.attempts + 1;
          remaining.push({ ...item, attempts, nextAttemptAt: now + Math.min(15 * 60_000, 2 ** attempts * 5_000) + Math.floor(this.random() * 1_000) });
        }
      }
      await this.store.set({ [KEY]: remaining }); return { sent, paused };
    } finally { this.draining = false; }
  }
}
