'use client';

import { Clock } from 'lucide-react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { createRoot, type Root } from 'react-dom/client';
import { Badge } from '@/components/ui/badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { isNotOperating, waitTimeBadgeClass } from '@/lib/blog/live-display';
import { cn } from '@/lib/utils';
import type { AttractionStatus, CrowdLevel, ParkStatus } from '@/lib/api/types';

/**
 * The live badges' English messages: a root mounted with `createRoot` does not inherit the page's
 * NextIntlClientProvider, and this slice is far smaller than the full messages JSON.
 */
const BADGE_MESSAGES = {
  parks: {
    status: {
      OPERATING: 'Open',
      DOWN: 'Down',
      CLOSED: 'Closed',
      REFURBISHMENT: 'Refurbishment',
      UNKNOWN: 'Unknown',
    },
    crowdLevels: {
      very_low: 'Very Low',
      low: 'Low',
      normal: 'Normal',
      moderate: 'Normal',
      higher: 'Higher',
      high: 'High',
      very_high: 'Very High',
      extreme: 'Extreme',
      full: 'Full',
      closed: 'Closed',
    },
  },
  common: { min: 'min' },
};

/** The compact pill sizing `BlogParkLink` uses after a referenced name, so the preview matches. */
const INLINE_BADGE = 'h-[18px] gap-0.5 px-1.5 py-0 text-[10px] font-semibold no-underline';

export interface InlineBadgeData {
  kind: 'park' | 'ride';
  status?: string | null;
  crowdLevel?: string | null;
  waitTime?: number | null;
}

function RideWaitBadge({ minutes }: { minutes: number }) {
  const t = useTranslations('common');
  return (
    <Badge className={cn(waitTimeBadgeClass(minutes), INLINE_BADGE)}>
      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
      {minutes} {t('min')}
    </Badge>
  );
}

function InlineBadge({ data }: { data: InlineBadgeData }) {
  const closed = isNotOperating(data.status as ParkStatus | AttractionStatus | undefined);
  if (closed) {
    if (!data.status) return null;
    return (
      <ParkStatusBadge
        status={data.status as ParkStatus | AttractionStatus}
        className={INLINE_BADGE}
      />
    );
  }
  if (data.kind === 'ride' && typeof data.waitTime === 'number') {
    return <RideWaitBadge minutes={data.waitTime} />;
  }
  if (data.kind === 'park' && data.crowdLevel) {
    return <CrowdLevelBadge level={data.crowdLevel as CrowdLevel} className={INLINE_BADGE} />;
  }
  return null;
}

/**
 * Mounts the real `ParkStatusBadge`, `CrowdLevelBadge` or wait-time `Badge` into a widget
 * decoration's DOM node. The caller unmounts the returned root in the decoration's `destroy`.
 */
export function mountInlineBadge(container: HTMLElement, data: InlineBadgeData): Root {
  const root = createRoot(container);
  root.render(
    <NextIntlClientProvider locale="en" messages={BADGE_MESSAGES} timeZone="UTC">
      <InlineBadge data={data} />
    </NextIntlClientProvider>
  );
  return root;
}
