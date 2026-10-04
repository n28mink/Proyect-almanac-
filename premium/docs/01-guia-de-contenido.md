# Guía de contenido: cómo añadir productos, imágenes, vídeos y colecciones

## Productos
Fuente de verdad: `scripts/data/clover-source.json` (catálogo original de Clover) + traducciones `scripts/data/en.*.json`.
El seed (`npm run seed`) los convierte en `src/content/catalog.generated.json`, que valida `zod` al arrancar (`src/domain/catalog.ts`).
1. Añade la foto real a `scripts/data/` según la convención del pipeline y ejecuta `npm run media` (genera AVIF/WebP/JPG responsivos, `blur`, foco y recortes de detalle en `public/media/products` + `media.generated.json`).
2. Añade la ficha (precio en dólares, colores, texto ES/EN) y ejecuta `npm run seed`.
3. **No declares materiales que la ficha no afirme.** El seed solo copia lo que el original declara.
4. En producción los cambios de precio/stock/visibilidad se hacen desde `/es/admin` (overrides persistidos en el almacén de datos), sin recompilar; el servidor siempre recalcula precios (`computeQuote`).

## Imágenes
Solo fotos reales de Clover. Las de empaque o sin producto visible se excluyen (`docs/seed-excluded.json` lista 31 con su motivo). Cada imagen lleva `alt` ES/EN.

## Vídeos
- Cada clip vive en `public/media/video/<clave>.{mp4,webm}` (+ `.mobile.*` y póster `.jpg`) y se registra en `src/content/media.generated.json`; los rótulos accesibles en `src/content/media.ts`.
- **Los clips incluidos son movimiento generado sobre las fotos reales (Ken Burns/etalonado con `scripts/render-clips.mjs`), no metraje filmado.** Para producción, sustitúyelos por vídeo real conservando la clave y los nombres de archivo: el sistema no cambia.
- Renderizar de nuevo: `FFMPEG=/ruta/ffmpeg node scripts/render-clips.mjs [clave …]`.
- Referencia en una campaña: `src/content/campaigns.ts` (`videoKey`), editable desde admin.

## Colecciones y categorías
- Categorías (las 12 páginas reales): `src/config/taxonomy.ts` (slug, nombres ES/EN, portada, SEO).
- Colecciones: `src/content/collections.ts`; un producto se asigna con su campo `collection`.
- Diario / lookbook: `src/content/journal.ts`.

## Camisas

Las camisas viven en `scripts/data/shirts.json` (precio único, tallas, stock inicial por talla y, por camisa: nombre, color, cuello, descripción, texto alternativo y recorte del detalle).

- **Precio y tallas** (confirmados por la tienda): 12 USD; S, M, L y XL. Cada talla es una variante con su propio stock, editable en el panel. El stock inicial (5 por talla) es provisional.
- **Material y estampado**: poli-algodón; sublimación de tinta o DTF según el color de la camisa.
- **Personalización**: no pasa por el carrito ni tiene precio fijo. La ficha muestra «Personalízala» con un botón que abre WhatsApp con la camisa y la talla elegida ya escritas; la tienda envía la cotización.
- **Fotos**: la foto maestra va en `assets-src/shirts/<id>.jpg` (1000 × 1250, la camisa recortada sobre el fondo salvia de la marca, sin el fondo original). `npm run media:shirts` genera la foto de tienda y el detalle del estampado; luego `npm run seed`.
- **Añadir una camisa**: recortar la foto sobre el mismo fondo salvia (degradado `#ECF0E9` → `#DDE4DB`, sombra suave), guardarla como `assets-src/shirts/cmNN.jpg`, añadir su entrada en `shirts.json` y correr `npm run media:shirts && npm run seed`.

## Formas de pago

`src/domain/commerce.ts → paymentMethods`: pago móvil (preseleccionado), transferencia bancaria y efectivo. El cliente elige en el checkout (tarjetas con icono y, debajo, en texto, qué pasa con la elegida); la elección aparece en el resumen del pedido, en la confirmación, en el mensaje de WhatsApp y en el panel de pedidos. No se cobra en línea: los datos de pago se envían por WhatsApp.
