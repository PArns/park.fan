'use client';

import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { useParkHeadline } from '@/lib/hooks/use-park-headline';
import type { CrowdLevel } from '@/lib/api/types';

/**
 * An open park's crowd badge as the newest reading on the page has it (`useParkHeadline`), so a
 * card agrees with the favourites and the park's own page. A client leaf, since `ParkCard` also
 * renders on the server.
 */
export function LiveCrowdLevelBadge({
  parkId,
  crowdLevel,
  updatedAt,
}: {
  parkId: string | undefined;
  /** The card's own reading. */
  crowdLevel: CrowdLevel | undefined;
  /** When the API read `crowdLevel` (ISO 8601). */
  updatedAt: string | undefined;
}) {
  // Rendered for an open park only, so the status is not the card's to pass on.
  const headline = useParkHeadline(parkId, { status: 'OPERATING', crowdLevel, updatedAt });
  return headline.crowdLevel ? <CrowdLevelBadge level={headline.crowdLevel} /> : null;
}
