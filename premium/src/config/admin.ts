/**
 * Ruta pública (no enlazada en ningún sitio) del panel de administración. No es un secreto —la protección real es
 * el inicio de sesión de administrador y la comprobación de rol en servidor—, solo evita que el panel aparezca a
 * los visitantes. Cámbiala con NEXT_PUBLIC_ADMIN_PATH. El proxy la reescribe a /admin y bloquea /admin directo.
 */
export const ADMIN_PATH = (process.env.NEXT_PUBLIC_ADMIN_PATH ?? '').replace(/[^a-zA-Z0-9-]/g, '') || 'gestion';
