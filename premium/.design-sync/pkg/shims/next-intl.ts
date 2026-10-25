/** Sustituto de next-intl para el sistema de diseño: idioma fijo (es) y textos de marca. */
const brand: Record<string, string> = { subtitle: 'Accesorios y prendas' };
export const useLocale = () => 'es';
export const useTranslations = (ns?: string) => (key: string) => (ns === 'brand' && brand[key]) || key;
