import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Clover — Accesorios & Prendas',
    short_name: 'Clover',
    description: 'Joyería y accesorios elegidos pieza por pieza.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f1e9',
    theme_color: '#151412',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
