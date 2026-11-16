import { sessionCall } from '@/lib/admin/session-client';
import type { AdminSessionInfo } from '@/app/admin/_lib/types';

/**
 * A member managing their own account: the name, the password, the second factor, the sessions,
 * and the export of everything stored. The name and the export are the account's own routes
 * (`/api/account/*`); password, second factor and sessions are the session routes every account
 * has (`/api/admin/auth/*`), whose proxy also moves the token a password change re-issues into the
 * cookie.
 */

/** One signed-in device of the account. */
export type AccountSession = AdminSessionInfo;

const AUTH = '/api/admin/auth';

/** Renames the account. */
export function updateDisplayName(displayName: string) {
  return sessionCall<{ account: { displayName: string } }>('/api/account/profile', {
    method: 'PATCH',
    body: { displayName },
  });
}

/** Changes the password; the other sessions end, this one stays. */
export function changePassword(currentPassword: string, newPassword: string) {
  return sessionCall(`${AUTH}/change-password`, {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

/** Every session of the account, this one marked `current`. */
export async function listSessions(): Promise<AccountSession[]> {
  return (await sessionCall<{ sessions: AccountSession[] }>(`${AUTH}/sessions`)).sessions;
}

/** Ends one session elsewhere. */
export function endSession(id: string) {
  return sessionCall(`${AUTH}/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

/** Ends every session, this one too. */
export function signOutEverywhere() {
  return sessionCall(`${AUTH}/sessions/revoke-all`, { method: 'POST' });
}

/** Starts setting up a second factor: the secret and the `otpauth://` link for the app. */
export function beginTwoFactor(password: string) {
  return sessionCall<{ secret: string; uri: string }>(`${AUTH}/totp/begin`, {
    method: 'POST',
    body: { password },
  });
}

/** Turns the second factor on with a first code from the app. */
export function confirmTwoFactor(code: string) {
  return sessionCall(`${AUTH}/totp/confirm`, { method: 'POST', body: { code } });
}

/** Turns the second factor off; needs the password and a current code. */
export function disableTwoFactor(password: string, code: string) {
  return sessionCall(`${AUTH}/totp/disable`, { method: 'POST', body: { password, code } });
}

/** Downloads everything stored about the account as one JSON file. */
export async function downloadAccountExport(): Promise<void> {
  const data = await sessionCall<unknown>('/api/account/export');
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = 'park-fan-account.json';
  link.click();
  URL.revokeObjectURL(url);
}
