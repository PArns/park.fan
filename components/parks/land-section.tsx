import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { AttractionCard } from './attraction-card';
import { getAttractionBackgroundImage } from '@/lib/utils/park-assets';
import { getAttractionDisplayStatus } from '@/lib/utils/park-utils';
import type { ParkAttraction, ParkStatus } from '@/lib/api/types';

// Per-card memo boundary. `LandSection`'s own memo only bails when the whole land is unchanged;
// once the 5-min live poll touches ONE ride, the land's `attractions` array is rebuilt and every
// card in it re-rendered — 40+ cards, each with badges, a sparkline and two next/image renditions,
// for a single changed wait time. React Query's structural sharing keeps the ATTRACTION objects
// referentially identical when their values didn't change, so a shallow-prop memo lets exactly
// the changed cards re-render (all other props here are primitives or value-stable strings).
//
// The memo is applied HERE rather than on `AttractionCard` itself because that component is
// dual-use — blog widgets and the home stats section render it from Server Components, where
// `memo` isn't available.
const MemoAttractionCard = memo(AttractionCard);

interface LandSectionProps {
  landName: string;
  attractions: ParkAttraction[];
  parkPath: string;
  parkSlug: string; // Added for background image lookup
  parkStatus?: ParkStatus;
  timezone?: string;
}

// Memoized: on the park page the parent `TabsWithHash` re-renders on every search keystroke
// and every input focus/blur. All props here are shallow-stable across those renders (the
// `attractions` array is `useDeferredValue`-stable, the rest are primitives / value-equal
// strings), so the whole land — 100+ glass cards with sparklines on big parks — bails out
// instead of reconciling. It still re-renders when the 5-min live poll changes the data.
export const LandSection = memo(function LandSection({
  landName,
  attractions,
  parkPath,
  parkSlug,
  parkStatus,
  timezone,
}: LandSectionProps) {
  const t = useTranslations('parks');
  const operatingCount = attractions.filter(
    (a) => getAttractionDisplayStatus(a, parkStatus) === 'OPERATING'
  ).length;

  return (
    <section>
      <div className="bg-background/70 mb-4 flex w-fit items-center gap-3 rounded-lg px-3 py-1.5 backdrop-blur-md">
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <LayoutGrid className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{landName}</h2>
          <p className="text-muted-foreground text-sm">
            {t('operatingCount', { count: operatingCount, total: attractions.length })}
          </p>
        </div>
      </div>

      <ul className="grid [grid-auto-rows:auto_1fr_auto] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {attractions.map((attraction) => {
          // Get attraction background image with fallback to null
          const backgroundImage = getAttractionBackgroundImage(parkSlug, attraction.slug);

          return (
            <li key={attraction.id} className="row-span-3 grid [grid-template-rows:subgrid]">
              <MemoAttractionCard
                attraction={attraction}
                parkPath={parkPath}
                parkStatus={parkStatus}
                backgroundImage={backgroundImage}
                timezone={timezone}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
});
