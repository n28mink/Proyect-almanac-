# design-sync: notas de Clover

- Este repo es una app Next.js, no una librería: `.design-sync/pkg/build.mjs` empaqueta `src/components/ui/*` + `brand/Logo` como `@clover/ui` (esbuild + tsc + Tailwind). Si cambian esos componentes, ejecutar `node .design-sync/pkg/build.mjs` antes del convertidor.
- `next-intl`, `TransitionLink`, `StaggerText` y `PageTransition` se sustituyen por shims en `.design-sync/pkg/shims/` (sin Next ni GSAP). `process.env.*` de `site.ts` se define como `undefined`.
- El CSS (`pkg/dist/style.css`) = Tailwind (theme+preflight+utilities) + `tokens.css` + `motion.css` + `components.css` + la capa base de `globals.css`, escaneando `src/` y `.design-sync/previews`. Las fuentes `--font-*-loaded` se fijan a los nombres de familia (en la app las pone next/font).
- Render check: `DS_CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=<node_modules con playwright>` (la versión de playwright no coincide con el chromium cacheado).
- Comando del convertidor: `node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules <node_modules con react> --entry ./.design-sync/pkg/dist/index.es.js --out ./ds-bundle`.
- Alcance acordado: solo la base visual (ui/ + logotipo). Los 41 componentes que dependen de next/next-intl (cabecera, tarjetas de producto, carrito…) quedan fuera.

## Known render warns
- `[RENDER_THIN]` en `CategoryIcon`: solo pinta iconos SVG sin texto; es benigno.
- `[FONT_MISSING] "Didot"`: es un respaldo de la pila de `--font-brand`; la fuente real (Bodoni Moda) sí se envía.

## Re-sync risks
- Los previews usan precios/textos reales de la tienda como ejemplos (no se sincronizan con el catálogo).
- `Dialog` y `PageShell` usan `cardMode: single` con viewport fijo; `Field` usa `column`.
- Si se añade un componente a `ui/`, hay que exportarlo en `.design-sync/pkg/src/index.ts`.
