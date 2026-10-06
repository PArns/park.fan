/** An admin account's role, most privileged first. Mirrors the backend's `ADMIN_ROLES`. */
export type AdminRole = 'owner' | 'editor' | 'author' | 'viewer';

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
