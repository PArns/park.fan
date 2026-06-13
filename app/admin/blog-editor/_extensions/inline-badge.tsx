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
 * Minimal English message bundle for the live badges. The decoration is
 * mounted via `createRoot`, which creates a fresh React tree that does NOT
 * inherit the page's NextIntlClientProvider context. We therefore have to
 * carry the badge translations ourselves; the slice is tiny so bundle cost
 * is negligible and we avoid pulling in the full messages JSON.
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

/**
 * Identical compact sizing to what BlogParkLink uses for the inline pill
 * after a referenced name — keeps the editor preview visually in lockstep
 * with the published render without copy-pasting the badge implementations.
 */
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
 * Mount the real `ParkStatusBadge` / `CrowdLevelBadge` / wait-time Badge React
 * components into a DOM node owned by the ProseMirror widget decoration. The
 * returned Root must be unmounted from the decoration's `destroy` callback so
 * we don't leak React roots across editor sessions.
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
