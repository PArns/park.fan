'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { SelfServiceAuth } from '@/components/common/self-service-auth';
import { ACCOUNT_QUERY_KEY, useMembership } from '@/lib/account/member';
import { safeNextPath } from '@/lib/account/paths';
import { TURNSTILE_ACTIONS } from '@/lib/security/turnstile-actions';

/** The page to return to, from `?next=`; read in the browser only. */
function nextPath(): string {
  return safeNextPath(new URLSearchParams(window.location.search).get('next'));
}

/**
 * The visitor sign-in at `/login`: create an account or sign in, both behind Turnstile, then back
 * to the members-only page that sent the visitor here (`?next=`), or to the account. A member who
 * is already signed in goes straight on.
 */
export function LoginPanel() {
  const t = useTranslations('account');
  const router = useRouter();
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
      registerEndpoint="/api/account/register"
      registerAction={TURNSTILE_ACTIONS.accountRegister}
      copy={{
        registerTitle: t('auth.registerTitle'),
        registerLead: t('auth.registerLead'),
        loginTitle: t('auth.loginTitle'),
        loginLead: t('auth.loginLead'),
      }}
      onSignedIn={() => {
        // The session set the marker; the account is read afresh on the page it goes to.
        void client.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEY });
        router.replace(nextPath());
      }}
    />
  );
}
