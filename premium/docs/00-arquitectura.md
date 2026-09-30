# Clover — Arquitectura y decisiones

Este documento es el plano previo a la implementación. Resume el análisis de las 10 referencias,
las decisiones de arquitectura y los cinco sistemas que sostienen el proyecto
(design system, animación, media/video, datos y seguridad). Se actualiza cuando cambia una decisión.

## 1. Análisis de referencias y licencias

Regla del proyecto: **no se copia código, texto, imágenes, vídeos ni marca de ningún repositorio**.
Las referencias sirven para estudiar patrones (jerarquía, interacción, ritmo, arquitectura).
Todo el código de este repositorio es original.

| # | Repositorio | Licencia (verificada en el repo) | Uso permitido | Qué se estudió / qué aportó |
|---|-------------|----------------------------------|---------------|-----------------------------|
| 1 | vercel/commerce | MIT © Vercel | Código (con aviso) — **no se copió** | Forma del carrito (`useOptimistic`, acciones de servidor), variante en la URL con disponibilidad por combinación, `generateMetadata`/sitemap/robots/JSON-LD. Evitado: proveedor cableado, datos obsoletos por días, cero cabeceras de seguridad |
| 2 | rahulgotrekiya/AURUM | Sin LICENSE (README informal) → todos los derechos reservados | Solo referencia | Jerarquía de ficha de joyería (specs → desglose de precio → talla → confianza), filtros por metal/peso, corazón visible en táctil. Evitado: `innerHTML`, precios del cliente, sin `prefers-reduced-motion` |
| 3 | v01dst/noir-ecommerce-template | Sin LICENSE (README dice MIT, sin texto) → solo referencia | Solo referencia | Contraste tipográfico editorial (serif display grande vs. micro-etiquetas en mayúsculas), bordes rectos, hairlines, imágenes 3:4. Evitado: sin reduced-motion, texto al 50 % de opacidad, imágenes `<img>` sin dimensiones |
| 4 | pras75299/Jewellery | Sin LICENSE (README dice MIT, sin texto) → solo referencia | Solo referencia | Rate limit + límite de body en `middleware`, cabeceras de seguridad, totales del checkout recalculados en servidor, Dockerfile no-root. Evitado: `remotePatterns` `**`, sanitizador con regex, precios `Float`, sin modelo de joyería |
| 5 | mirumee/nimara-ecommerce | BSD-3-Clause © Mirumee Labs | Código (con aviso) — **no se copió** | Capas dominio → proveedores → UI, next-intl `as-needed` + mapa mercado→moneda, cadena de middlewares, env con zod, "las llaves de pago nunca en el cliente", JSON-LD tipado. Evitado: monorepo de 10 paquetes, sin CSP ni rate limit |
| 6 | fatelessdev/xilar | Apache-2.0 (titular sin rellenar) | Código (con aviso) — **no se copió** | Disciplina `gsap.context` + `revert()`, cursor solo con `pointer: fine`, play/pause de reels con IntersectionObserver, marquesina con dirección. Evitado: reels sin poster, navbar monolítico de 1 075 líneas |
| 7 | KaranChandekar/ecommerce-product-showcase | Sin LICENSE (README dice MIT, archivo ausente) → solo referencia | Solo referencia | Canvas R3F montado por IntersectionObserver + `ssr:false`, entorno de estudio + sombras de contacto, fly-to-cart rect→rect. Evitado: ids del DOM globales, sin cleanup, sin reduced-motion, sin fallback |
| 8 | salah-khaled-dev/aura-brand | MIT © Salah Khaled (activos sin procedencia clara: no reutilizables) | Código — **no se copió** | Paleta marfil/grafito/oro apagado/bronce, ritmo de bandas alternas, cabecera que se contrae. Evitado: 43 MB de PNG, dependencias infladas, contraste 2.2:1 en acentos |
| 9 | Harshshah6/gsap-navigation-menu | Sin LICENSE → solo referencia | Solo referencia | Menú a pantalla completa con `clip-path` + enmascarado escalonado. Evitado (y mejorado): sin aria/foco/Escape/scroll-lock, 1.25 s de apertura, ScrollSmoother, sin reduced-motion |
| 10 | itswadesh/svelte-commerce | MIT © Misiki & contributors | Solo concepto (Svelte) | Contrato UX por capas, tokens semánticos, filtros por URL con chips y bottom sheet, matriz de estados (default/hover/focus/loading/empty/error), barra de compra sticky en móvil |

Conclusiones transversales:

- Ninguna referencia implementa transiciones de página con Next App Router: `AnimatePresence` en un layout no
  puede animar la salida (el árbol viejo se desmonta). Se diseña un sistema propio (cortina + navegación en paralelo).
- Ninguna tiene `prefers-reduced-motion` global, CSP ni rate limit de calidad: aquí son requisitos de base.
- Ninguna tiene modelo de joyería real (metal, quilates, piedra, talla de anillo, cuidado): se diseña uno propio.

Los activos (fotos) usados son **las fotos propias de Clover** ya presentes en el repositorio original. No se usan
imágenes ni vídeos de terceros.

## 2. Arquitectura final

```
Next.js 16 (App Router, RSC, Turbopack) · React 19 · TypeScript estricto · Tailwind CSS v4
Motion (framer-motion) — UI/estado · GSAP + ScrollTrigger — scroll y timelines · Lenis — scroll suave
React Three Fiber — solo visor 3D bajo demanda · next-intl — EN/ES · zod — validación · jose — sesiones
```

Capas (dependencias solo hacia abajo):

```
app/            rutas, layouts, metadata, route handlers, server actions (delgadas)
components/     UI presentacional + sistema de motion + media (sin lógica de negocio)
stores/         estado cliente efímero (carrito, favoritos, UI) — Zustand
server/         servicios (pricing, checkout, órdenes), repositorios, pagos, auth, seguridad
domain/         tipos + esquemas zod (fuente de verdad del modelo)
content/        catálogo generado, colecciones, campañas, media registry, journal
config/         sitio, taxonomía, monedas, tokens de motion
```

Decisiones clave:

- **Estáticas por defecto**: home, categorías, colecciones, producto y journal se generan estáticamente
  (`generateStaticParams` × locales) con `revalidate`. Los filtros de la tienda son estado de URL en cliente sobre la
  lista ya renderizada, así la página base sigue siendo estática y cacheable.
- **El servidor es la única autoridad de precios**: el carrito del cliente guarda solo `{variantId, qty}`;
  `quote()` recalcula precios, descuentos, envío e impuestos desde el repositorio. El checkout nunca lee un precio del cliente.
- **Repositorios intercambiables**: `StoreAdapter` (JSON en `.data/`, memoria si el FS es de solo lectura). Cambiar a
  Postgres/Supabase = implementar la misma interfaz.
- **Pagos por adaptador**: `PaymentProvider` (`mock` por defecto, `stripe` vía REST sin SDK). Ninguna llave sale del servidor.
- **CSP escalonada** (Next exige render dinámico para nonces): rutas sensibles (checkout, cuenta, admin, auth)
  usan `script-src 'nonce-…' 'strict-dynamic'`; el resto usa una política estática estricta en todo lo demás para conservar ISR/CDN.
- **i18n**: `next-intl`, prefijo de locale siempre (`/es`, `/en`), hreflang + `x-default`, textos localizados en el
  contenido (`LocalizedString`), moneda por selector (formato con `Intl`).

## 3. Design system

Fuente única: `src/styles/tokens.css` (`@theme` de Tailwind v4) + `src/config/motion.ts` (movimiento).

- **Color**: marfil `#f6f1e9` (página) · porcelana `#fbf8f3` (superficie) · hueso `#ebe4d8` · tinta `#151412` (negro suave) ·
  carbón `#2b2926` · grafito `#57524b` (texto secundario, 6.9:1 sobre marfil) · bronce `#7d5c3d` (texto de acento, 5.4:1) ·
  champagne `#c4a878` (solo decoración y fondos oscuros: 2:1 sobre marfil, 8:1 sobre tinta). Sin dorado brillante.
- **Tipografía**: Cormorant Garamond (display, variable, autoalojada) + Manrope (UI, variable, autoalojada).
  Escala fluida `display-xl → micro`, micro-etiquetas 11–12 px en mayúsculas con tracking .2em.
- **Espacio y layout**: contenedores `narrow/content/wide/ultra`, gutter fluido, breakpoints
  `sm 640 · md 768 (tablet) · lg 1024 (laptop) · xl 1280 (desktop) · 2xl 1536 · 3xl 1920 · 4xl 2560 (ultrawide)`.
- **Forma**: bordes rectos, hairlines 1 px, sombras suaves y frías, sin gradientes decorativos.
- **Capas (z)**: header 40 · drawer 60 · modal 70 · transición 90 · toast 100 (los `<dialog>` usan top layer).

## 4. Sistema de animación

- **Tokens** en `src/config/motion.ts`: duraciones (`instant 120 · fast 240 · base 420 · slow 700 · cinematic 1100 ms`) y
  curvas (`luxe`, `expo`, `curtain`, `inOut`) expresadas una sola vez y exportadas a CSS, Motion y GSAP (misma curva exacta).
- **Regla de reparto**: CSS + IntersectionObserver para reveals (barato, sin JS bloqueante); GSAP para scroll-scrub, pin,
  timelines de transición y marquesina; Motion para estado de UI (drawers, listas, presencia); WAAPI para el vuelo al carrito.
- **Sin flash antes de hidratar**: los estados ocultos se declaran en CSS bajo
  `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, con red de seguridad si la hidratación no llega.
  Lo que está sobre el pliegue (LCP) nunca arranca oculto; usa animaciones CSS de entrada.
- **Transiciones de página**: `TransitionProvider` + `TransitionLink`. Máquina de estados
  `idle → covering → navigating → revealing`. La navegación (`router.push`) arranca en paralelo con la cubierta;
  la revelación empieza cuando la ruta nueva está montada. Variantes: `curtain` (tinta), `ivory` (porcelana),
  `clip` (revelado por clip-path), `mask` (máscara de trébol) y `direction` (izquierda/derecha).
  Duración total objetivo 450–900 ms; con `prefers-reduced-motion` la navegación es instantánea.
- **Accesibilidad**: `prefers-reduced-motion` respetado en todo el sistema; el anunciador de rutas de Next se mantiene;
  el foco se mueve al `<main>` tras navegar por teclado.

## 5. Arquitectura de media y vídeo

- Todo el contenido audiovisual se declara en `src/content/media.ts` (**registry tipado por clave**):
  los componentes piden `media('home.hero')`, nunca rutas. Cambiar un vídeo = editar el registry (o el override del admin).
- `<LuxuryVideo />`: SSR pinta solo el **poster** (`next/image`, LCP); el `<video>` se monta tras hidratar
  (idle) o al entrar en viewport, elige fuente móvil/escritorio con `matchMedia`, `preload` configurable, se pausa fuera de
  pantalla, respeta reduced-motion (solo poster) y expone control de pausa accesible.
- Formatos: MP4 H.264 (compatibilidad) + WebM VP9 (peso), variantes de recorte móvil (9:16) y escritorio (16:9), poster JPEG/WebP.
- `scripts/build-media.mjs` regenera imágenes optimizadas, placeholders blur y los clips de campaña
  a partir de las fotos propias (ffmpeg). Los clips incluidos son **motion-grading de fotos existentes**, no una sesión
  de vídeo: se sustituyen por metraje real cambiando el registry, sin tocar componentes.

## 6. Modelo de datos

Tipos en `src/domain/` (zod como fuente de verdad, tipos inferidos). Importes en **céntimos enteros** (USD base).

`Product`: `id, slug, name{en,es}, description{en,es}, story{en,es}, category, categories[], collection, audience[], price,
compareAtPrice?, currency, material, color[], sizes[], variants[], images[], videos[], thumbnail, hoverMedia?, specifications[],
stock, featured, newArrival, bestseller, model3d?, seo{title,description}`.
`Variant`: `id, sku, options{color,size}, price?, stock`. `Order`, `OrderLine`, `Address`, `User`, `Promotion`, `Campaign` completan el dominio.

Semilla: las 104 piezas reales de Clover se curan (solo fotografía limpia, sin empaque ni sellos) y se convierten con
`scripts/build-seed.mjs` en `src/content/catalog.generated.json`, con nombres y descripciones bilingües fieles al original
(sin afirmar materiales que la ficha original no declara).

## 7. Seguridad (resumen)

Validación zod en servidor en cada acción · precios/stock/envío recalculados en servidor · sesiones JWT firmadas
(`jose`, HS256) en cookie `HttpOnly; Secure; SameSite=Lax` · contraseñas con `scrypt` + sal · rate limiting
(ventana deslizante en memoria, intercambiable por Redis) · comprobación de origen en mutaciones · roles (`customer`/`admin`) en
capa de datos y en layouts · CSP + HSTS + `X-Content-Type-Options` + `Referrer-Policy` + `Permissions-Policy` + COOP ·
secretos solo en variables de entorno validadas · webhooks con firma HMAC y comparación en tiempo constante.
