import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { buildCsp, isSensitivePath } from '@/server/security/csp';

describe('CSP escalonada', () => {
  it('rutas sensibles usan nonce + strict-dynamic y sin unsafe-inline en scripts', () => {
    const csp = buildCsp({ nonce: 'abc123' });
    expect(csp).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*unsafe-inline/);
  });
  it('siempre cierra objetos, base, frames y formularios', () => {
    for (const csp of [buildCsp(), buildCsp({ nonce: 'x' })]) {
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("form-action 'self'");
    }
  });
  it('unsafe-eval solo en desarrollo', () => {
    expect(buildCsp({ dev: true })).toContain("'unsafe-eval'");
    expect(buildCsp({ dev: false })).not.toContain("'unsafe-eval'");
  });
  it('clasifica rutas sensibles por idioma', () => {
    for (const p of ['/es/checkout', '/en/checkout/success', '/es/admin', '/en/admin/login']) expect(isSensitivePath(p)).toBe(true);
    for (const p of ['/es', '/en/shop', '/es/product/x', '/es/administracion']) expect(isSensitivePath(p)).toBe(false);
  });
});

describe('contraseñas (scrypt)', () => {
  it('verifica la correcta y rechaza la incorrecta; la sal hace únicos los hashes', async () => {
    const a = await hashPassword('correct horse battery');
    const b = await hashPassword('correct horse battery');
    expect(a).not.toBe(b);
    expect(await verifyPassword('correct horse battery', a)).toBe(true);
    expect(await verifyPassword('wrong', a)).toBe(false);
    expect(await verifyPassword('x', 'garbage')).toBe(false);
  });
});
