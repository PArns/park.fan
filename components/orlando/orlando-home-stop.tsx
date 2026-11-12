import { getTranslations } from 'next-intl/server';
import { CalendarDays } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { HomeStop, StopLink } from '@/components/home/home-stop';
import { catchNonFatal } from '@/lib/api/client';
import { getOrlandoRegion } from '@/lib/orlando/api';
import { regionGroups, shortGroupName, shortParkName } from '@/lib/orlando/hub-data';
import { orlandoPath } from '@/lib/orlando/paths';

/**
 * The homepage's stop for the Orlando hub: what it is and its link, beside the region's parks by
 * resort, from the open `/trip-regions/orlando` (a day in the Data Cache). No forecast here: the
 * homepage keeps a day at the edge, and a day named "today" would be yesterday's by evening.
 */
export async function OrlandoHomeStop() {
  const t = await getTranslations('homeStory.orlando');
  const region = await catchNonFatal(getOrlandoRegion());
  return (
    <HomeStop
      divider
      heading={
        <ChapterHeading
          variant="stop"
          icon={CalendarDays}
          kicker={t('kicker')}
          title={t('title')}
          hint={t('lead')}
          action={<StopLink href={orlandoPath()}>{t('link')}</StopLink>}
        />
      }
    >
      {region ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {regionGroups(region).map((group) => (
            <li key={group.key} className="border-border/60 bg-card/50 rounded-xl border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {shortGroupName(group.name)}
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {group.parks.map((park) => shortParkName(park.name)).join(' · ')}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div />
      )}
    </HomeStop>
  );
}
