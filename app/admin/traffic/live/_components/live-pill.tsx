'use client';

import Link from 'next/link';
import { formatCount } from '@/lib/admin/site-analytics';
import { Chip } from '../../../_ui/primitives';

/**
 * The way from a traffic page into the live view: a pill with how many visitors are on the site,
 * the count the caller already polls. The dot is still, since the pill sits on a blurred panel.
 */
export function LivePill({ active }: { active: number | undefined }) {
  return (
    <Link
      href="/admin/traffic/live"
      title="Live: wer in den letzten fünf Minuten auf park.fan war"
      className="inline-flex rounded-full transition-[filter] hover:brightness-125 max-sm:min-h-9 max-sm:items-center"
    >
      <Chip tone="success" className="tabular-nums">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Live
        {active !== undefined && <span className="text-foreground">{formatCount(active)}</span>}
      </Chip>
    </Link>
  );
}
