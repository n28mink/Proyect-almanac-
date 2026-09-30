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
