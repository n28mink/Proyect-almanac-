import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

const data = new Map<string, string>();
let server: http.Server;
const seen: string[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      seen.push(String(req.headers.authorization));
      const [cmd, key, value] = JSON.parse(body) as [string, string, string?];
      res.setHeader('content-type', 'application/json');
      if (cmd === 'GET') res.end(JSON.stringify({ result: data.get(key) ?? null }));
      else if (cmd === 'SET') {
        data.set(key, value!);
        res.end(JSON.stringify({ result: 'OK' }));
      } else res.end(JSON.stringify({ error: 'ERR unknown command' }));
    });
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = 'secret-token';
});
afterAll(async () => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  await new Promise((r) => server.close(r));
});

describe('almacén Redis REST (persistencia en Vercel)', () => {
  it('lee, escribe y serializa actualizaciones concurrentes sin perder ninguna', async () => {
    vi.resetModules();
    delete (globalThis as { __cloverStore?: unknown }).__cloverStore;
    const { store } = await import('@/server/store/json-store');
    expect(await store.read('orders', [])).toEqual([]);
    await Promise.all(Array.from({ length: 12 }, (_, i) => store.update<number[]>('n', [], (cur) => [...cur, i])));
    const final = await store.read<number[]>('n', []);
    expect(final).toHaveLength(12);
    expect(new Set(final).size).toBe(12);
    expect(data.has('clover:n')).toBe(true);
    expect(seen.every((h) => h === 'Bearer secret-token')).toBe(true);
  });
});
