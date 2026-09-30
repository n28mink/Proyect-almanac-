import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';
import type { PublicUser } from '@/domain/commerce';
import { authSecret, env } from '../env';
import { findById, toPublic } from '../repositories/users';

const MAX_AGE = 60 * 60 * 24 * 14;

function cookieName(): string {
  return env().NODE_ENV === 'production' ? '__Host-clover_session' : 'clover_session';
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(authSecret());
  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: env().NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(cookieName());
}

/** Usuario de la sesión actual (verificado en cada petición contra el almacén, no solo contra el token). */
export async function getSessionUser(): Promise<PublicUser | null> {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const user = await findById(payload.sub);
    return user ? toPublic(user) : null;
  } catch {
    return null;
  }
}
