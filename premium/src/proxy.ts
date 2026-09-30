import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PATH } from '@/config/admin';
import { routing } from '@/i18n/routing';
import { buildCsp, generateNonce, isSensitivePath } from '@/server/security/csp';

const handleI18nRouting = createIntlMiddleware(routing);

/** Ruta pública del panel → ruta interna. /admin directo y las antiguas rutas de cuenta de cliente no existen (404). */
const ADMIN_PUBLIC = new RegExp(`^/(es|en)/${ADMIN_PATH}(/.*)?$`);
const HIDDEN = /^\/(es|en)\/(admin|login|register|account)(\/|$)/;

/**
 * Cadena de proxy: (1) enrutado i18n, (2) CSP + cabeceras de privacidad.
 * Las rutas sensibles reciben nonce (render dinámico), no se indexan y no se cachean.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let internal: string | undefined;
  const admin = ADMIN_PUBLIC.exec(pathname);
  if (admin) internal = `/${admin[1]}/admin${admin[2] ?? ''}`;
  else if (HIDDEN.test(pathname)) internal = `/${pathname.split('/')[1]}/__no-existe`;

  const sensitive = isSensitivePath(admin ? internal! : pathname);
  const nonce = sensitive ? generateNonce() : undefined;
  const csp = buildCsp({ nonce, dev: process.env.NODE_ENV !== 'production' });

  // La CSP va también en la petición: Next extrae el nonce de ahí al renderizar.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('content-security-policy', csp);
  if (nonce) requestHeaders.set('x-nonce', nonce);
  const forwarded = new NextRequest(request, { headers: requestHeaders });

  const response = internal ? NextResponse.rewrite(new URL(internal, request.url), { request: { headers: requestHeaders } }) : handleI18nRouting(forwarded);
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
