import localFont from 'next/font/local';

/** Serif editorial para titulares. Autoalojada (sin peticiones a terceros). */
export const displayFont = localFont({
  src: [
    { path: '../assets/fonts/cormorant-garamond-latin-wght-normal.woff2', style: 'normal', weight: '300 700' },
  ],
  variable: '--font-display-loaded',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

/** Sans refinada para navegación y UI. */
export const sansFont = localFont({
  src: [{ path: '../assets/fonts/manrope-latin-wght-normal.woff2', style: 'normal', weight: '200 800' }],
  variable: '--font-sans-loaded',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

/** Solo para el nombre de la marca: serif de alto contraste (Bodoni Moda, licencia OFL), en mayúsculas. */
export const brandFont = localFont({
  src: [{ path: '../assets/fonts/bodoni-moda-latin-wght-normal.woff2', style: 'normal', weight: '400 900' }],
  variable: '--font-brand-loaded',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
