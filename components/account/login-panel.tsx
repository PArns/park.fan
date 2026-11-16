'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter as useAppRouter } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { SelfServiceAuth } from '@/components/common/self-service-auth';
import { ACCOUNT_QUERY_KEY, useMembership } from '@/lib/account/member';
import { safeNextPath } from '@/lib/account/paths';
import { isStaffRole } from '@/lib/admin/roles';
import { DEVELOPER_DASHBOARD_PATH } from '@/lib/developers/paths';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';

/**
 * Whether visitors may create accounts here. The API decides (`ACCOUNT_REGISTRATION=open`); this
 * only hides the form it would refuse, so set both together.
 */
const ACCOUNT_REGISTRATION_OPEN = process.env.NEXT_PUBLIC_ACCOUNT_REGISTRATION === 'open';

/** The page to return to, from `?next=`; read in the browser only. */
function nextPath(): string {
  return safeNextPath(new URLSearchParams(window.location.search).get('next'));
}

/**
 * The visitor sign-in at `/login`: sign in, or create an account while registration is open, both
 * behind Turnstile, then back
 * to the members-only page that sent the visitor here (`?next=`), or to the account. Developers
 * and staff sign in here too and go to their dashboard or the admin. A member who is already
 * signed in goes straight on.
 */
export function LoginPanel() {
  const t = useTranslations('account');
  const router = useRouter();
  // The admin lives outside the locale routes, so the plain router, which adds no prefix.
  const appRouter = useAppRouter();
  const client = useQueryClient();
  const membership = useMembership();
  const member = membership.status === 'member';

  useEffect(() => {
    if (member) router.replace(nextPath());
  }, [member, router]);

  if (membership.status !== 'guest') {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status">
        <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label={t('loading')} />
      </div>
    );
  }

  return (
    <SelfServiceAuth
      register={
        ACCOUNT_REGISTRATION_OPEN
          ? { endpoint: '/api/account/register', action: TURNSTILE_ACTIONS.accountRegister }
          : undefined
      }
      copy={{
        registerTitle: t('auth.registerTitle'),
        registerLead: t('auth.registerLead'),
        loginTitle: t('auth.loginTitle'),
        loginLead: t('auth.loginLead'),
      }}
      onSignedIn={(role) => {
        // The session set the marker; the account is read afresh on the page it goes to.
        void client.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
        // One sign-in for every account: each goes where its role has something to see.
        if (role && isStaffRole(role)) appRouter.push('/admin');
        else if (role === 'developer') router.replace(DEVELOPER_DASHBOARD_PATH);
        else router.replace(nextPath());
      }}
    />
  );
}
