import { env } from '../env';

/**
 * Ventana deslizante en memoria (por proceso). Suficiente para una instancia; en producción multi-instancia
 * sustituir `hits` por Redis/Upstash manteniendo la misma firma.
 */
const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (!env().RATE_LIMIT_ENABLED) return { ok: true, remaining: limit, retryAfterSec: 0 };
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - (recent[0] ?? now))) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t > windowMs)) hits.delete(k);
  return { ok: true, remaining: limit - recent.length, retryAfterSec: 0 };
}

/** IP del cliente tras un proxy de confianza. `x-forwarded-for` es spoofable si no hay proxy delante. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'local';
}
