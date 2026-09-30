# Checklist de producción

**Bloqueantes (no lanzar sin esto)**
- [ ] `AUTH_SECRET` ≥ 32 caracteres aleatorios; `ADMIN_PASSWORD` fuerte y único (los valores de `.env.local` son de prueba).
- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio real (canonicals, sitemap, hreflang, OG).
- [ ] Sustituir el almacén JSON (`src/server/store/json-store.ts`) por una base de datos gestionada: en hosting de solo lectura usa memoria y **se pierde todo** al reiniciar. Los repositorios ya aíslan el acceso.
- [ ] Rate limiting en memoria → Redis/Upstash si hay más de una instancia (`src/server/security/rate-limit.ts`).
- [ ] Stripe: `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, endpoint `/api/webhooks/stripe`. **El adaptador está implementado y su firma probada con tests, pero no se ha ejecutado contra Stripe real**: prueba en modo test antes de cobrar.
- [ ] Textos legales (`src/content/legal.ts`) son plantillas, **no asesoría legal**: revísalos con un abogado (envíos, devoluciones, privacidad, cookies).
- [ ] Tipos de cambio (`src/config/site.ts`) son valores fijos de ejemplo: conecta un proveedor FX o define precios por moneda.
- [ ] Sustituir clips de movimiento generado por vídeo filmado real (ver guía de contenido).
- [ ] Email transaccional (confirmación de pedido, recuperación de contraseña) no incluido: añadir proveedor.

**Verificaciones incluidas** — `npm run check` (tipos + lint + 34 tests) y `npm run test:e2e` (12 pruebas: home, 12 categorías, compra completa con proveedor mock, i18n/JSON-LD/hreflang, sitemap/robots, rutas privadas, webhook, axe WCAG A/AA, sin desbordamiento móvil).

**Seguridad ya aplicada** — CSP con nonce + `strict-dynamic` en rutas sensibles (checkout, cuenta, admin, login) y CSP estática en el resto; HSTS, `frame-ancestors 'none'`, `nosniff`, Referrer/Permissions-Policy; cookie de sesión JWT `httpOnly` `SameSite=Lax` `Secure` en producción; scrypt para contraseñas; roles en servidor; validación `zod` en todas las Server Actions; precios y stock siempre recalculados en servidor; límites de intentos en login/registro/checkout; webhook con HMAC y ventana temporal; sin secretos en el cliente.

**Operación** — `/api/health` para sondas; imagen Docker `output: standalone` con usuario no root; cabeceras de caché inmutables para `/media` y `/_next/static`; revisar `npm audit` antes de cada despliegue.
