import type en from './messages/en.json';

/** Mensajes tipados: una clave inexistente en `t('…')` es un error de compilación. */
declare module 'next-intl' {
  interface AppConfig {
    Messages: typeof en;
    Locale: 'es' | 'en';
  }
}
