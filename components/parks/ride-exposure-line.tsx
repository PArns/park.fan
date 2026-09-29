import { Building2, Sun, Umbrella } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { IndoorOutdoor } from '@/lib/api/types';

const EXPOSURE = {
  indoor: { Icon: Building2, key: 'exposureIndoor' },
  outdoor: { Icon: Sun, key: 'exposureOutdoor' },
  covered_queue: { Icon: Umbrella, key: 'exposureCoveredQueue' },
} as const satisfies Record<IndoorOutdoor, { Icon: typeof Sun; key: string }>;

/**
 * Where the ride stands in the weather, as one line of text on the ride page: indoors, outdoors,
 * or outdoors behind a roofed queue. Deliberately not a `Badge` — the card carries none, and this
 * is a fact to read, not a filter to scan.
 *
 * `null` or absent is unknown and renders nothing. Most of the catalogue has never been checked,
 * so an absent line is not a statement that the ride is outdoors.
 */
export function RideExposureLine({ indoorOutdoor }: { indoorOutdoor?: IndoorOutdoor | null }) {
  const t = useTranslations('attractions.meta');
  if (indoorOutdoor == null) return null;
  const { Icon, key } = EXPOSURE[indoorOutdoor];
  return (
    <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t(key)}
    </p>
  );
}
