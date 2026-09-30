# Checklist de producción

**Bloqueantes (no lanzar sin esto)**
- [ ] `AUTH_SECRET` ≥ 32 caracteres aleatorios; `ADMIN_PASSWORD` fuerte y único; cambia `NEXT_PUBLIC_ADMIN_PATH` (la ruta del panel) por algo propio.
- [ ] **Persistencia**: en Vercel conecta *Upstash Redis* (Storage → Marketplace). Sin eso, los pedidos y los precios/inventario editados en el panel se pierden al reiniciar y ni siquiera son consistentes entre instancias. El adaptador Redis está probado con un servidor simulado, **no contra Upstash real**: haz un pedido y edita un precio tras conectarlo.
- [ ] `NEXT_PUBLIC_SITE_URL` con el dominio real (canonicals, sitemap, hreflang, OG).
- [ ] Inventario inicial: el stock viene del catálogo original; confírmalo y ajústalo desde el panel.
- [ ] Textos legales (`src/content/legal.ts`): partieron de los del catálogo original; revísalos con un profesional (ahora el pedido se registra en el sistema, no solo en WhatsApp).
- [ ] Cambios y devoluciones: se tomaron del catálogo original (7 días para defectos de fabricación, joyería sin devolución salvo defecto, cambios de talla en prendas dentro de 7 días). Confírmalos.
- [ ] Sustituir clips de movimiento generado por vídeo filmado real (ver guía de contenido).
- [ ] Rate limiting en memoria → Redis si hay varias instancias (`src/server/security/rate-limit.ts`).
- [ ] Notificación de pedidos nuevos: hoy el cliente los envía por WhatsApp; el panel los lista, pero no avisa por sí solo.

**Verificaciones incluidas** — `npm run check` (tipos + lint + 34 tests) y `npm run test:e2e` (16 pruebas: home y marca, 12 categorías, ausencia de cuentas de cliente, compra por WhatsApp, checkout con CSP de nonce, i18n/JSON-LD/hreflang, sitemap/robots, textos legales, panel oculto + confirmación de pago, axe WCAG A/AA, sin desbordamiento móvil; las del panel requieren `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

**Seguridad ya aplicada** — CSP con nonce + `strict-dynamic` en rutas sensibles (checkout, cuenta, admin, login) y CSP estática en el resto; HSTS, `frame-ancestors 'none'`, `nosniff`, Referrer/Permissions-Policy; cookie de sesión JWT `httpOnly` `SameSite=Lax` `Secure` en producción; scrypt para contraseñas; rol admin en servidor; panel en ruta no enlazada; validación `zod` en todas las Server Actions; precios y stock siempre recalculados en servidor; límites de intentos en login y pedidos; sin secretos en el cliente.

**Operación** — `/api/health` para sondas; imagen Docker `output: standalone` con usuario no root; cabeceras de caché inmutables para `/media` y `/_next/static`; revisar `npm audit` antes de cada despliegue.
