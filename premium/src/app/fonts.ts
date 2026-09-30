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
