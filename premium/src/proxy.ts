import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { buildCsp, generateNonce, isSensitivePath } from '@/server/security/csp';

const handleI18nRouting = createIntlMiddleware(routing);

/**
 * Cadena de proxy: (1) enrutado i18n, (2) CSP + cabeceras de privacidad.
 * Las rutas sensibles reciben nonce (render dinámico), no se indexan y no se cachean.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sensitive = isSensitivePath(pathname);
  const nonce = sensitive ? generateNonce() : undefined;
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV !== 'production' });

  // La CSP va también en la petición: Next extrae el nonce de ahí al renderizar.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('content-security-policy', csp);
  if (nonce) requestHeaders.set('x-nonce', nonce);
  const forwarded = new NextRequest(request, { headers: requestHeaders });

  const response = handleI18nRouting(forwarded);
  response.headers.set('Content-Security-Policy', csp);

  if (sensitive) {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return response;
}

export const config = {
  // Excluye API, internos de Next, archivos con extensión (activos estáticos).
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
