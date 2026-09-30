import { ADMIN_PATH } from '@/config/admin';
import type { PublicUser } from '@/domain/commerce';
import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { getSessionUser } from './session';

/** Exige rol admin. La autorización real vive aquí (y en cada acción), no solo en la UI. */
export async function requireAdmin(locale: Locale): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect({ href: `/${ADMIN_PATH}/login`, locale });
  return user as PublicUser;
}

/** Para server actions: lanza en vez de redirigir. */
export async function assertAdmin(): Promise<PublicUser> {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') throw new Error('No autorizado');
  return user;
}
