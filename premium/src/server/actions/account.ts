'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { addressInputSchema } from '@/domain/commerce';
import { getSessionUser } from '../auth/session';
import { updateUser, withAddress } from '../repositories/users';
import { baseCatalog } from '../repositories/catalog';

export type FormState = { ok?: boolean; error?: 'invalid' | 'auth' } | undefined;

export async function addAddressAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'auth' };
  const parsed = addressInputSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: 'invalid' };
  const { isDefault, ...rest } = parsed.data;
  await updateUser(user.id, (u) => withAddress(u, { ...rest, isDefault: !!isDefault }));
  revalidatePath('/[locale]/account/addresses', 'page');
  return { ok: true };
}

export async function removeAddressAction(fd: FormData): Promise<void> {
  const user = await getSessionUser();
  const id = z.string().uuid().safeParse(fd.get('id'));
  if (!user || !id.success) return;
  await updateUser(user.id, (u) => ({ ...u, addresses: u.addresses.filter((a) => a.id !== id.data) }));
  revalidatePath('/[locale]/account/addresses', 'page');
}

export async function updateProfileAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: 'auth' };
  const parsed = z.object({ name: z.string().trim().min(2).max(80), locale: z.enum(['es', 'en']) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: 'invalid' };
  await updateUser(user.id, (u) => ({ ...u, ...parsed.data }));
  revalidatePath('/[locale]/account', 'layout');
  return { ok: true };
}

/** Sincroniza favoritos del invitado con la cuenta: solo se aceptan ids que existen en el catálogo. */
export async function syncWishlistAction(ids: string[]): Promise<string[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const valid = new Set(baseCatalog().map((p) => p.id));
  const clean = [...new Set(ids.filter((i) => typeof i === 'string' && valid.has(i)))].slice(0, 200);
  const updated = await updateUser(user.id, (u) => ({ ...u, wishlist: clean }));
  return updated?.wishlist ?? [];
}

export async function loadWishlistAction(): Promise<string[] | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const { findById } = await import('../repositories/users');
  return (await findById(user.id))?.wishlist ?? [];
}
