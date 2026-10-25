#!/usr/bin/env node
/**
 * Empaqueta los componentes visuales de la tienda (ui/ + logotipo) como una librería para /design-sync:
 *   dist/index.es.js  (esbuild, React externo; next-intl, TransitionLink y StaggerText se sustituyen por shims sin Next)
 *   dist/**.d.ts      (tsc)
 *   dist/style.css    (Tailwind 4 con los tokens de src/styles + @font-face de las fuentes de la marca)
 * Uso: node .design-sync/pkg/build.mjs   (desde premium/, con node_modules y .ds-sync/node_modules instalados)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const dist = path.join(here, 'dist');
const dsReq = createRequire(path.join(root, '.ds-sync/package.json'));
const appReq = createRequire(path.join(root, 'package.json'));
const esbuild = dsReq('esbuild');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });

const s = (f) => path.join(here, 'shims', f);
await esbuild.build({
  entryPoints: [path.join(here, 'src/index.ts')],
  outfile: path.join(dist, 'index.es.js'),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  tsconfig: path.join(root, 'tsconfig.json'),
  alias: {
    'next-intl': s('next-intl.ts'),
    '@/components/motion/TransitionLink': s('TransitionLink.tsx'),
    '@/components/motion/Reveal': s('Reveal.tsx'),
    '@/components/motion/PageTransition': s('PageTransition.ts'),
  },
  // site.ts lee el entorno de Next (URL del sitio): en el sistema de diseño no aplica.
  define: { 'process.env.VERCEL_PROJECT_PRODUCTION_URL': 'undefined', 'process.env.NEXT_PUBLIC_SITE_URL': 'undefined' },
  logLevel: 'warning',
});

// Tipos: solo los de la entrada y lo que importa.
fs.writeFileSync(path.join(here, 'tsconfig.dts.json'), JSON.stringify({
  extends: '../../tsconfig.json',
  compilerOptions: {
    noEmit: false, declaration: true, emitDeclarationOnly: true, rootDir: '../..', outDir: './dist/types', incremental: false, skipLibCheck: true,
    baseUrl: '../..',
    paths: {
      'next-intl': ['.design-sync/pkg/shims/next-intl.ts'],
      '@/components/motion/TransitionLink': ['.design-sync/pkg/shims/TransitionLink.tsx'],
      '@/components/motion/Reveal': ['.design-sync/pkg/shims/Reveal.tsx'],
      '@/components/motion/PageTransition': ['.design-sync/pkg/shims/PageTransition.ts'],
      '@/*': ['src/*'],
    },
  },
  include: ['src/index.ts'.replace(/^/, '.design-sync/pkg/')].map((p) => `../../${p}`),
}, null, 2));
try { execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', path.join(here, 'tsconfig.dts.json')], { stdio: 'inherit' }); } catch { console.error('! tsc con avisos'); }
fs.writeFileSync(path.join(dist, 'index.d.ts'), "export * from './types/.design-sync/pkg/src/index';\n");

// Fuentes de la marca.
const FONTS = { 'Cormorant Garamond': ['cormorant-garamond-latin-wght-normal.woff2', '300 700'], Manrope: ['manrope-latin-wght-normal.woff2', '200 800'], 'Bodoni Moda': ['bodoni-moda-latin-wght-normal.woff2', '400 900'] };
let faces = '';
for (const [family, [file, weight]] of Object.entries(FONTS)) {
  fs.copyFileSync(path.join(root, 'src/assets/fonts', file), path.join(dist, 'fonts', file));
  faces += `@font-face{font-family:'${family}';src:url('./fonts/${file}') format('woff2');font-weight:${weight};font-style:normal;font-display:swap}\n`;
}

// CSS: Tailwind 4 con los tokens y los estilos de componentes, solo con las clases que usan estos componentes.
const postcss = appReq('postcss');
const tw = appReq('@tailwindcss/postcss');
const entry = path.join(here, 'style.src.css');
// Mismo CSS que la app: tokens + estilos de componentes + la capa base de globals.css (sin Lenis ni el import completo de Tailwind).
const globals = fs.readFileSync(path.join(root, 'src/styles/globals.css'), 'utf8').replace(/^@import .*$/gm, '').replace(/html\.lenis[\s\S]*?\n  \}\n/g, '');
fs.writeFileSync(entry, `@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(base);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '../../src/styles/tokens.css';
@import '../../src/styles/motion.css';
@import '../../src/styles/components.css';
@source '../../src';
@source '../previews';
:root { --font-sans-loaded: 'Manrope'; --font-display-loaded: 'Cormorant Garamond'; --font-brand-loaded: 'Bodoni Moda'; --header-h: 0px; --announcement-h: 0px; }
${globals}
`);
const out = await postcss([tw()]).process(fs.readFileSync(entry, 'utf8'), { from: entry });
fs.writeFileSync(path.join(dist, 'style.css'), faces + out.css);
console.log('✔ dist listo:', fs.readdirSync(dist).join(', '), `· css ${Math.round(out.css.length / 1024)} KB`);
