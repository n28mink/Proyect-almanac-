import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.email().optional(),
  ADMIN_PASSWORD: z.string().min(10).optional(),
  PAYMENT_PROVIDER: z.enum(['mock', 'stripe']).default('mock'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  DATA_DIR: z.string().default('.data'),
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;
let devSecret: string | undefined;

/** Lectura validada y perezosa: el build estático no exige secretos; el primer uso real sí. */
export function env(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Variables de entorno inválidas: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  cached = parsed.data;
  if (cached.PAYMENT_PROVIDER === 'stripe' && (!cached.STRIPE_SECRET_KEY || !cached.STRIPE_WEBHOOK_SECRET)) {
    throw new Error('PAYMENT_PROVIDER=stripe requiere STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET.');
  }
  return cached;
}

/** Secreto de sesión. En producción es obligatorio (≥32 caracteres); en desarrollo se genera uno por proceso. */
export function authSecret(): Uint8Array {
  const e = env();
  if (e.AUTH_SECRET) {
    if (e.AUTH_SECRET.length < 32) throw new Error('AUTH_SECRET debe tener al menos 32 caracteres.');
    return new TextEncoder().encode(e.AUTH_SECRET);
  }
  if (e.NODE_ENV === 'production') throw new Error('AUTH_SECRET es obligatorio en producción.');
  devSecret ??= crypto.randomUUID() + crypto.randomUUID();
  return new TextEncoder().encode(devSecret);
}
