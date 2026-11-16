'use client';

import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useMembership, type Membership } from '@/lib/account/member';
import { loginPathFor } from '@/lib/account/paths';
import type { AccountOverview } from '@/lib/account/sync';

/**
 * Members-only content. The gate is a courtesy, not the control: everything a member reads comes
 * from `/api/account/*`, which answers only the member's own session. Both read
 * `useMembership()`, so a page with several gated parts asks the API once.
 */

/**
 * Shows its children to signed-in members and `fallback` (nothing by default) to everyone else,
 * for a members-only feature inside a public page.
 */
export function MembersOnly({
  children,
  fallback = null,
}: {
  children: ReactNode | ((overview: AccountOverview) => ReactNode);
  fallback?: ReactNode;
}) {
  const membership = useMembership();
  if (membership.status !== 'member') return <>{fallback}</>;
  return <>{typeof children === 'function' ? children(membership.overview) : children}</>;
}

/** The spinner a members-only page shows while it finds out who is there. */
function Pending() {
  const t = useTranslations('account');
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-label={t('loading')} />
    </div>
  );
}

/**
 * A whole members-only page: members see it, a guest is sent to the sign-in, which brings them
 * back here afterwards.
 */
export function MemberPage({
  children,
}: {
  children: (membership: Extract<Membership, { status: 'member' }>) => ReactNode;
}) {
  const membership = useMembership();
  const router = useRouter();
  const pathname = usePathname();
  const guest = membership.status === 'guest';

  useEffect(() => {
    // The query is read here rather than through `useSearchParams`, which would make every
    // members-only page wait on a Suspense boundary for a value only this redirect needs.
    if (guest) router.replace(loginPathFor(`${pathname}${window.location.search}`));
  }, [guest, pathname, router]);

  if (membership.status !== 'member') return <Pending />;
  return <>{children(membership)}</>;
}
