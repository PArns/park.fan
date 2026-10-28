/** An admin account's role, most privileged first. Mirrors the backend's `ADMIN_ROLES`. */
export type AdminRole = 'owner' | 'editor' | 'author' | 'viewer';

/** What each role is called on screen. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Inhaber',
  editor: 'Redaktion',
  author: 'Autor',
  viewer: 'Lesend',
};

const ROLE_RANK: Record<AdminRole, number> = {
  owner: 30,
  editor: 20,
  author: 10,
  viewer: 0,
};

/**
 * Returns true when an admin role ranks at or above the given minimum (owner > editor > author >
 * viewer).
 */
export function roleAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return (ROLE_RANK[role] ?? -1) >= ROLE_RANK[minimum];
}

/** Who an admin session belongs to, as `auth/me` and the account list answer. */
export interface AdminIdentity {
  id: string | null;
  email: string;
  displayName: string;
  role: AdminRole;
  legacy: boolean;
  mustChangePassword: boolean;
  totpEnabled: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

/**
 * Why an identity may not use a route that needs `minRole`, as the status and message to answer
 * with, or `null` when it may. Kept apart from `requireAdmin` so `pnpm test:guards` can pin it
 * without a backend.
 */
export function adminGuardRefusal(
  identity: Pick<AdminIdentity, 'role' | 'mustChangePassword'> | null,
  minRole: AdminRole
): { status: 401 | 403; error: string } | null {
  if (!identity) return { status: 401, error: 'Unauthorized' };
  if (identity.mustChangePassword) {
    return { status: 403, error: 'This account must choose a new password first' };
  }
  if (!roleAtLeast(identity.role, minRole)) {
    return { status: 403, error: `This action needs the "${minRole}" role or above` };
  }
  return null;
}
