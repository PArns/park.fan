/**
 * An account's role, most privileged first. Mirrors the backend's `ADMIN_ROLES`. `developer` and
 * `user` are not staff: an outside developer's account, which reaches the developer dashboard, and
 * a visitor's, which reaches its own synced state; neither reaches anything of the admin.
 */
export type AdminRole = 'owner' | 'editor' | 'author' | 'viewer' | 'developer' | 'user';

/** What each role is called on screen. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Inhaber',
  editor: 'Redaktion',
  author: 'Autor',
  viewer: 'Lesend',
  developer: 'Entwickler',
  user: 'Besucher',
};

const ROLE_RANK: Record<AdminRole, number> = {
  owner: 30,
  editor: 20,
  author: 10,
  viewer: 0,
  developer: -10,
  user: -20,
};

/**
 * Returns true when an admin role ranks at or above the given minimum (owner > editor > author >
 * viewer).
 */
export function roleAtLeast(role: AdminRole, minimum: AdminRole): boolean {
  return (ROLE_RANK[role] ?? -1) >= ROLE_RANK[minimum];
}

/** The role is staff: it reaches the admin, unlike a developer's or a visitor's account. */
export function isStaffRole(role: AdminRole): boolean {
  return roleAtLeast(role, 'viewer');
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
