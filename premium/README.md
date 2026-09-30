# Clover — e-commerce de joyería y moda de lujo

Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript estricto · Tailwind v4 · GSAP + Lenis · React Three Fiber (solo el visor 3D, bajo demanda) · next-intl (ES/EN) · zustand · zod.
Identidad de Clover: verde de marca `#0b3f2b`, dorado champán `#b7985e` y marfil, con el wordmark «Clover🍀» y el subtítulo «Accesorios y Prendas»; titulares en Cormorant Garamond, texto en Manrope (autoalojadas, licencia OFL). Venta solo en Venezuela, pedidos por WhatsApp (sin pago en línea ni cuentas de cliente).
Diseño y decisiones: `docs/00-arquitectura.md` (incluye el análisis de las 10 referencias y sus licencias: solo se tomaron ideas y patrones, **no** se copió código, marcas ni activos) · contenido: `docs/01-guia-de-contenido.md` · lanzamiento: `docs/02-produccion.md`.

## B) Instalación
```bash
node -v            # ≥ 20.9 (probado en 22)
npm install
cp .env.example .env.local   # rellena AUTH_SECRET (openssl rand -base64 48), ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev        # http://localhost:3000  → redirige a /es
npm run check      # tipos + lint + tests unitarios
npm run build && npm start
npm run test:e2e   # requiere build; PW_CHROMIUM_PATH=/ruta/chromium si no usas el de Playwright
```
Variables (todas en `.env.example`, comentadas): `NEXT_PUBLIC_SITE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_ADMIN_PATH`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DATA_DIR`, `RATE_LIMIT_ENABLED`. Ninguna con prefijo `NEXT_PUBLIC_` es secreta.

## C) Despliegue
- **Docker** (recomendado, tiene disco persistente): `docker build -t clover . && docker run -p 3000:3000 -v clover-data:/app/.data --env-file .env.production clover`.
- **Node**: `npm run build && npm start` detrás de un proxy TLS (HSTS ya se envía).
- **Vercel/serverless**: funciona, pero el sistema de archivos es de solo lectura → el almacén cae a memoria. Sustituye antes el adaptador por una BD (ver checklist).
- **Datos en Vercel**: añade *Storage → Marketplace → Upstash Redis* al proyecto (crea `UPSTASH_REDIS_REST_URL/TOKEN`); sin eso, precios/inventario editados y pedidos se pierden al reiniciar la función.
- **Panel**: `https://TU-DOMINIO/es/<NEXT_PUBLIC_ADMIN_PATH>` (por defecto `gestion`; cámbialo). No está enlazado en el sitio.

## D) Dependencias
Producción: `next`, `react`, `react-dom`, `next-intl` (i18n y rutas por idioma), `gsap` + `@gsap/react` (ScrollTrigger, transiciones), `lenis` (scroll suave sin secuestro), `three` + `@react-three/fiber` + `@react-three/drei` (visor 3D, carga diferida), `zustand` (carrito/favoritos/UI), `zod` (validación), `jose` (JWT de sesión del administrador), `clsx` + `tailwind-merge` (clases).
Desarrollo: `typescript`, `tailwindcss` + `@tailwindcss/postcss`, `eslint` + `eslint-config-next`, `vitest`, `@playwright/test` + `@axe-core/playwright`, `sharp` (pipeline de imágenes), tipos.
Sin librerías de UI, de estado remoto ni de pagos: Clover cobra por WhatsApp (pago móvil, transferencia o efectivo), y Redis se usa por REST sin SDK.

## A) Estructura
```
src/
  app/[locale]/            páginas: home, shop, shop/[category] (12), collections(/[slug]), product/[slug],
                           wishlist, checkout(/success), admin/* (ruta oculta), journal, lookbook, about, legal
  app/api/                 health        · sitemap.ts, robots.ts, manifest.ts
  proxy.ts                 i18n + CSP con nonce (rutas sensibles) + cabeceras
  components/
    motion/                SmoothScroll, Reveal, ParallaxMedia, MagneticButton, KineticMarquee, PageTransition, TransitionLink, fly-to-cart
    media/LuxuryVideo      sistema de vídeo
    home/                  16 bloques de la portada
    product/ shop/ cart/ checkout/ account/ (login del panel) layout/ ui/ three/ seo/ brand/
  config/                  motion.ts (tokens), site.ts, taxonomy.ts (categorías)
  domain/                  catalog.ts (modelo Product), commerce.ts, i18n.ts
  content/                 catálogo generado, media, colecciones, campañas, diario, legal, promociones
  server/                  actions/ services/ (pricing, checkout) repositories/ store/ auth/ payments/ security/
  stores/  lib/  i18n/  styles/ (tokens.css, motion.css, components.css)
messages/                  es.json, en.json (mismas claves; test lo verifica)
scripts/                   build-media (sharp), build-seed, render-clips (ffmpeg + Playwright)
tests/unit  tests/e2e      vitest · Playwright + axe
docs/  Dockerfile  playwright.config.ts  vitest.config.ts
```

## E) Sistema de animación
- **Tokens** en `src/config/motion.ts` (duraciones y curvas) espejados en `tokens.css`; un test comprueba que no divergen.
- **Componentes centralizados**: `Reveal` (CSS + IntersectionObserver, con *failsafe* y solo si hay JS y no `prefers-reduced-motion`), `ParallaxMedia` y máscaras (GSAP ScrollTrigger), `KineticMarquee`, `MagneticButton`, pinned/scroll-expand en `home/ScrollExpandVideo`.
- **Scroll**: Lenis sincronizado con el ticker de GSAP; nunca captura la rueda ni bloquea el scroll nativo.
- **Transiciones de página** (`PageTransition` + `TransitionLink`): máquina de estados *covering → router.push → navigating → revealing*, 450–900 ms, 5 variantes (`curtain`, `ivory`, `clip`, `mask`, `direction`); sin bloquear la navegación si falla JS ni con reduced-motion.
- **Fly-to-cart**: clon de la imagen viajando al icono con WAAPI (solo `transform`), pulso de la insignia y anuncio `aria-live`.
- Solo se animan `transform`/`opacity`/`clip-path`: sin CLS.

## F) Sistema de vídeo (`<LuxuryVideo/>`)
Renderiza en servidor **solo el póster** (imagen optimizada, dimensiones reservadas → sin CLS ni bloqueo del FCP). El `<video>` se monta tras *idle* y solo cuando entra en pantalla; `webm` + `mp4`, fuente móvil recortada distinta, pausa al salir del viewport, y con `prefers-reduced-motion` o `saveData` queda el póster con botón de reproducir. Si el vídeo falla, permanece el póster. Se registra por clave en `content/media` (véase la guía de contenido).
**Aviso honesto:** los clips actuales son movimiento y etalonado sobre fotos reales, no metraje filmado.

## G) Modelo de producto (`src/domain/catalog.ts`)
`Product`: `id`, `slug`, `sku`, nombre/descripción/historia/alt en `{es,en}`, `categories[]`, `collection`, `gender`, `price` (céntimos, USD base), `material`/`color`/`finish`, `variants[]` (id, etiqueta, talla, `stock`, `imageIndex`), `images[]` (src, alt, blur, foco, recorte *macro*), `videos[]` (claves), `hoverMedia` (segunda imagen o vídeo), `specifications[]`, `model3d` opcional (forma de caja, correa, acabados, esferas), flags (`isNew`, `bestSeller`, `giftable`) y SEO. Se valida con `zod` al cargar; el cliente solo conoce ids y cantidades, y el servidor recalcula precio y stock; el pedido (`Order`: contacto, dirección en Venezuela, líneas, total, estado) se registra como `pending_payment` y el inventario se descuenta al marcarlo «Pagado».

## H) Checklist de producción
Ver `docs/02-produccion.md`.
