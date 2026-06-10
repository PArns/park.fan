import 'server-only';
import { getServerAuthHeaders } from '@/lib/api/client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.park.fan';

/** Re-validate a pass against the backend at most every 5 minutes. */
const VALIDATION_TTL_MS = 5 * 60_000;
const validatedUntil = new Map<string, number>();

/**
 * Validates the admin pass (from the `x-admin-pass` request header) against the
 * backend — the same check the admin login performs. The frontend deliberately
 * holds no pass secret of its own; successful validations are memoized briefly
 * so editor traffic doesn't hammer the backend.
 */
export async function isValidAdminPass(pass: string | null): Promise<boolean> {
  if (!pass) return false;

  const cached = validatedUntil.get(pass);
  if (cached && cached > Date.now()) return true;

  const url = `${API_BASE}/v1/admin/system-health?pass=${encodeURIComponent(pass)}`;
  const res = await fetch(url, { cache: 'no-store', headers: getServerAuthHeaders() });
  if (!res.ok) return false;

  if (validatedUntil.size > 100) validatedUntil.clear();
  validatedUntil.set(pass, Date.now() + VALIDATION_TTL_MS);
  return true;
}

/**
 * Guard for admin-only route handlers: returns null when the request carries a
 * valid `x-admin-pass` header, otherwise a ready-to-return 401 response.
 */
export async function requireAdminPass(request: Request): Promise<Response | null> {
  const ok = await isValidAdminPass(request.headers.get('x-admin-pass'));
  return ok ? null : Response.json({ error: 'Unauthorized' }, { status: 401 });
}
