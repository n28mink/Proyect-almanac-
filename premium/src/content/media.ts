import generated from './media.generated.json';
import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

/**
 * MEDIA REGISTRY — único lugar donde se declaran vídeos e imágenes de campaña.
 * Los componentes piden `getVideo('home.hero')`; cambiar el audiovisual = cambiar la ruta aquí
 * (o subir metraje real a /public/media/video y apuntar `sources`), sin tocar componentes.
 */

export interface PosterAsset {
  src: string;
  width: number;
  height: number;
  blur?: string;
  tone?: string;
}

export interface VideoSourceAsset {
  src: string;
  type: string;
  width: number;
  height: number;
}

export interface VideoAsset {
  key: string;
  /** Descripción para lectores de pantalla (los vídeos son ambientales, sin diálogo). */
  label: Localized;
  duration: number;
  poster: { desktop: PosterAsset; mobile?: PosterAsset };
  sources: { desktop: VideoSourceAsset[]; mobile?: VideoSourceAsset[] };
  /** Pistas de subtítulos/descripción si el vídeo tuviera locución. */
  captions?: Array<{ src: string; srclang: string; label: string }>;
}

type GeneratedVideo = {
  duration: number;
  sources: Record<string, VideoSourceAsset[]>;
  posters: Record<string, PosterAsset>;
};

const labels: Record<string, Localized> = {
  'hero.campaign': L('Campaña Clover: reloj, collar de luna, pulsera de corazones y anillo en luz cálida', 'Clover campaign: watch, moon necklace, heart bracelet and ring in warm light'),
  'campaign.jewelry': L('Anillos y aretes en primer plano con destellos suaves', 'Rings and earrings in close-up with soft glints'),
  'campaign.watches': L('Relojes dorados sobre hojas y cristal', 'Gold-tone watches among leaves and glass'),
  'editorial.fashion': L('Joyas puestas: aretes y collar en retrato editorial', 'Jewelry worn: earrings and necklace in an editorial portrait'),
  'story.craft': L('Detalles macro de texturas y acabados', 'Macro details of textures and finishes'),
  'reel.watches': L('Relojes en detalle', 'Watches in detail'),
  'reel.rings': L('Anillos en detalle', 'Rings in detail'),
  'reel.necklaces': L('Collares en detalle', 'Necklaces in detail'),
  'reel.earrings': L('Aretes en detalle', 'Earrings in detail'),
  'reel.bracelets': L('Pulseras en detalle', 'Bracelets in detail'),
};

const videos = (generated as unknown as { videos?: Record<string, GeneratedVideo> }).videos ?? {};

function toAsset(key: string): VideoAsset | null {
  const g = videos[key];
  if (!g) return null;
  const desktopKey = g.posters.desktop ? 'desktop' : (Object.keys(g.posters)[0] as string);
  const desktop = g.posters[desktopKey];
  const sources = g.sources[desktopKey];
  if (!desktop || !sources) return null;
  return {
    key,
    label: labels[key] ?? L('Vídeo de producto', 'Product video'),
    duration: g.duration,
    poster: { desktop, mobile: g.posters.mobile },
    sources: { desktop: sources, mobile: g.sources.mobile },
  };
}

export function getVideo(key: string): VideoAsset | null {
  return toAsset(key);
}

export function hasVideo(key: string): boolean {
  return key in videos;
}

export function listVideoKeys(): string[] {
  return Object.keys(videos);
}
