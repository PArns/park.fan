import { handleSelfRegistration } from '@/lib/admin/self-registration';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/account/register: a visitor's own account (role `user`), which starts the sync. */
export function POST(request: Request) {
  return handleSelfRegistration(request, {
    apiPath: '/v1/account/register',
    turnstileAction: TURNSTILE_ACTIONS.accountRegister,
    role: 'user',
  });
}
