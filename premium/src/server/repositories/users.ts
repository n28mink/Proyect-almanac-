import { userSchema, type Address, type PublicUser, type User } from '@/domain/commerce';
import { env } from '../env';
import { hashPassword } from '../auth/password';
import { store } from '../store/json-store';

const KEY = 'users';
let adminEnsured = false;

async function all(): Promise<User[]> {
  await ensureAdmin();
  return store.read<User[]>(KEY, []);
}

/** Crea/actualiza el administrador a partir de ADMIN_EMAIL + ADMIN_PASSWORD (única vía para obtener rol admin). */
async function ensureAdmin(): Promise<void> {
  if (adminEnsured) return;
  adminEnsured = true;
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = env();
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await store.update<User[]>(KEY, [], (users) => {
    const existing = users.find((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (existing) return users.map((u) => (u === existing ? { ...u, role: 'admin' as const, passwordHash } : u));
    return [
      ...users,
      { id: crypto.randomUUID(), email: ADMIN_EMAIL.toLowerCase(), name: 'Admin', role: 'admin', passwordHash, locale: 'es', createdAt: new Date().toISOString(), addresses: [], wishlist: [] },
    ];
  });
}

export const toPublic = (u: User): PublicUser => ({ id: u.id, email: u.email, name: u.name, role: u.role, locale: u.locale });

export async function findByEmail(email: string): Promise<User | undefined> {
  return (await all()).find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function findById(id: string): Promise<User | undefined> {
  return (await all()).find((u) => u.id === id);
}

export async function listUsers(): Promise<User[]> {
  return all();
}

export async function createCustomer(input: { email: string; name: string; passwordHash: string; locale: 'es' | 'en' }): Promise<User> {
  await ensureAdmin();
  const user: User = userSchema.parse({
    id: crypto.randomUUID(),
    email: input.email.toLowerCase(),
    name: input.name,
    role: 'customer',
    passwordHash: input.passwordHash,
    locale: input.locale,
    createdAt: new Date().toISOString(),
    addresses: [],
    wishlist: [],
  });
  await store.update<User[]>(KEY, [], (users) => [...users, user]);
  return user;
}

export async function updateUser(id: string, patch: (u: User) => User): Promise<User | undefined> {
  let result: User | undefined;
  await store.update<User[]>(KEY, [], (users) =>
    users.map((u) => {
      if (u.id !== id) return u;
      result = patch(u);
      return result;
    }),
  );
  return result;
}

export function withAddress(user: User, address: Omit<Address, 'id'>): User {
  const id = crypto.randomUUID();
  const makeDefault = address.isDefault || user.addresses.length === 0;
  const addresses = user.addresses.map((a) => (makeDefault ? { ...a, isDefault: false } : a));
  return { ...user, addresses: [...addresses, { ...address, id, isDefault: makeDefault }] };
}
