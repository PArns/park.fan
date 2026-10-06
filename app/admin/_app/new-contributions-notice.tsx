'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAdminQuery } from '../_lib/api';
import { useToast } from '../_ui/toast';
import { useCan } from './session';
import type { SubmissionSummary } from '@/lib/contribute/types';

/**
 * "Photos came in" — said once, when you arrive.
 *
 * Visitor submissions wait in a queue nobody opens without a reason, and the
 * first ones sat there for days. So the shell asks after the login whether
 * anything is pending that this browser has not been told about, and says so
 * with a way straight to it. Asked again when the tab comes back into focus
 * after a while, because the admin is a long-lived tab and "after the login"
 * can be the morning.
 *
 * "Told about" is per browser and lives in localStorage: it is a reader's
 * convenience, not a fact about the submission, and a second moderator on
 * another machine should get their own notice. Arriving on the moderation page
 * counts as being told.
 */

const SEEN_KEY = 'parkfan_admin_contributions_seen';

/** Five minutes: a focus within that does not ask the blob store again. */
const STALE_MS = 5 * 60_000;

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen(value: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, value);
  } catch {
    // Private window or blocked storage: the notice repeats, nothing breaks.
  }
}

function describe(fresh: SubmissionSummary['pending']): string {
  const named = fresh
    .slice(0, 3)
    .map((s) => `${s.name} (${s.photos === 1 ? '1 Foto' : `${s.photos} Fotos`})`)
    .join(', ');
  return fresh.length > 3 ? `${named} und ${fresh.length - 3} weitere` : named;
}

/**
 * Shows one toast for visitor photo submissions this browser has not been told about yet, with a
 * link to the moderation page. Renders nothing; only asked for accounts from `author` up.
 */
export function NewContributionsNotice() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  // The summary route answers from `author` up; a viewer would only collect a 403.
  const allowed = useCan('author');

  const { data } = useAdminQuery<SubmissionSummary>(
    ['admin', 'contributions', 'summary'],
    '/api/admin/contributions/summary',
    { enabled: allowed, staleTime: STALE_MS, refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (!data) return;
    const seen = readSeen();
    const fresh = data.pending.filter((s) => seen === null || s.createdAt > seen);
    if (!fresh.length) return;

    // Newest first, so the head of the list is the new high-water mark.
    writeSeen(fresh[0].createdAt);
    if (pathname.startsWith('/admin/contributions')) return;

    toast.push({
      title: fresh.length === 1 ? 'Neue Einsendung' : `${fresh.length} neue Einsendungen`,
      description: describe(fresh),
      tone: 'info',
      // Longer than an ordinary info toast: it arrives while the page is still
      // loading, which is when nobody is looking at the corner yet.
      duration: 15_000,
      action: {
        label: 'Ansehen',
        icon: ArrowRight,
        onClick: () => router.push('/admin/contributions'),
      },
    });
    // `pathname` is read, not reacted to: navigating must not re-announce.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- leaves out `pathname`, `router`, `toast`: the notice answers a fetch, not a navigation
  }, [data]);

  return null;
}
