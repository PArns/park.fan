import { handleSelfRegistration } from '@/lib/admin/self-registration';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/developers/register: a developer's own account (role `developer`). */
export function POST(request: Request) {
  return handleSelfRegistration(request, {
    apiPath: '/v1/developer/register',
    turnstileAction: TURNSTILE_ACTIONS.developerRegister,
    role: 'developer',
  });
}
