/**
 * Content-Security-Policy escalonada.
 *
 * - Rutas sensibles (checkout y panel de administración): render dinámico + nonce + `strict-dynamic`.
 * - Resto (catálogo estático/ISR): Next inyecta scripts inline sin nonce en páginas prerenderizadas, por lo que
 *   se permite `'unsafe-inline'` SOLO en script-src y se cierra todo lo demás (objetos, base, frames, formularios).
 *   Es el compromiso documentado para conservar caché de CDN.
 */

const SENSITIVE = /^\/(es|en)\/(checkout|admin)(\/|$)/;

export function isSensitivePath(pathname: string): boolean {
  return SENSITIVE.test(pathname);
}

export interface CspOptions {
  nonce?: string;
  dev?: boolean;
}

export function buildCsp({ nonce, dev = false }: CspOptions = {}): string {
  const scriptSrc = nonce
    ? ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]
    : ["'self'", "'unsafe-inline'"];
  if (dev) scriptSrc.push("'unsafe-eval'");

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    // Los atributos style="" que React serializa en el HTML requieren 'unsafe-inline'; el riesgo de estilos es bajo.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'media-src': ["'self'", 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': dev ? ["'self'", 'ws:', 'wss:'] : ["'self'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const parts = Object.entries(directives).map(([key, values]) => `${key} ${values.join(' ')}`);
  if (!dev) parts.push('upgrade-insecure-requests');
  return parts.join('; ');
}

export function generateNonce(): string {
  return btoa(crypto.randomUUID());
}
