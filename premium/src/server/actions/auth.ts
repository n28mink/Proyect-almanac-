'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { redirect } from '@/i18n/navigation';
import { isLocale, type Locale } from '@/i18n/routing';
import { ADMIN_PATH } from '@/config/admin';
import { verifyPassword } from '../auth/password';
import { createSession, destroySession } from '../auth/session';
import { findByEmail } from '../repositories/users';
import { clientKey, rateLimit } from '../security/rate-limit';

export type AuthState = { error?: 'invalid' | 'credentials' | 'rate' } | undefined;

const loginSchema = z.object({ email: z.email().max(120), password: z.string().min(1).max(200) });
// Hash ficticio para igualar el tiempo de respuesta cuando el correo no existe (evita enumeración por temporización).
const DUMMY = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '==';

function localeOf(fd: FormData): Locale {
  const l = String(fd.get('locale') ?? '');
  return isLocale(l) ? l : 'es';
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const locale = localeOf(fd);
  const parsed = loginSchema.safeParse({ email: fd.get('email'), password: fd.get('password') });
  if (!parsed.success) return { error: 'invalid' };
  const h = await headers();
  if (!rateLimit(`login:${clientKey(h)}:${parsed.data.email.toLowerCase()}`, 6, 60_000).ok) return { error: 'rate' };

  const user = await findByEmail(parsed.data.email);
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY);
  if (!user || !ok) return { error: 'credentials' };

  await createSession(user.id);
  // Solo administradores: el destino es siempre el panel (sin parámetro `next`, sin open-redirect).
  redirect({ href: `/${ADMIN_PATH}`, locale });
}

export async function logoutAction(fd: FormData): Promise<void> {
  await destroySession();
  redirect({ href: `/${ADMIN_PATH}/login`, locale: localeOf(fd) });
}
