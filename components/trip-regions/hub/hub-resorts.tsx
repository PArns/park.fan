import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { BedDouble, ChevronRight, MapPinned } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { linkBlockAttributes, linkEntityAttributes } from '@/lib/analytics/internal-link';
import {
  parkCalendarHref,
  regionGroups,
  shortGroupName,
  shortParkName,
} from '@/lib/trip-regions/hub-data';
import { hubPhoto } from '@/lib/trip-regions/hub-media';
import { getRegionTranslations } from '@/lib/trip-regions/region-messages';
import { ownWords } from '@/lib/trip-regions/region-words';
import type { TripHub } from '@/lib/trip-regions/registry';
import type { TripBestDays, TripRegion, TripRegionPark } from '@/lib/trip-regions/types';

/**
 * The parks whose crowd calendar the hub links: every park the window has quiet days for (a water
 * park out of season has none), or, without `/best-days`, every headliner, so a failed read never
 * takes the links away.
 */
export function calendarParks(
  region: TripRegion,
  bestDays: TripBestDays | null
): (park: TripRegionPark) => boolean {
  if (!bestDays) return (park) => park.headliner;
  const shown = new Set(
    bestDays.parks
      .filter((p) => p.basis !== 'none' && (p.quiet.length > 0 || !!p.flat))
      .map((p) => p.slug)
  );
  return (park) => shown.has(park.slug);
}

/**
 * Chapter 03, the resorts: one card per API group in the order the region lists them
 * (`hub.resorts`; a group it does not list follows), with its photo (a group without one opens on
 * a tinted panel with its name, never on a picture another card shows), the region's two sentences, each park as a link to its crowd calendar („<park> Andrang-Kalender“,
 * the query that page ranks for) and one sentence on where to stay. Server HTML, open in both of
 * the hub's states. A card whose words are missing keeps its name and links.
 */
export async function HubResorts({
  index,
  region,
  hub,
  bestDays,
  locale,
}: {
  index: string;
  region: TripRegion;
  hub: TripHub;
  bestDays: TripBestDays | null;
  locale: string;
}) {
  const t = await getTranslations('tripHub');
  const tRegion = await getRegionTranslations(region.slug, 'hub');
  const linked = calendarParks(region, bestDays);
  const order = (key: string) => {
    const i = hub.resorts.findIndex((r) => r.group === key);
    return i < 0 ? hub.resorts.length : i;
  };
  const cards = regionGroups(region)
    .sort((a, b) => order(a.key) - order(b.key))
    .map((group) => {
      const photoId = hub.resorts.find((r) => r.group === group.key)?.photo;
      return {
        key: group.key,
        name: ownWords(tRegion, `resorts.${group.key}.name`) ?? shortGroupName(group.name),
        lead: ownWords(tRegion, `resorts.${group.key}.lead`),
        stay: ownWords(tRegion, `resorts.${group.key}.stay`),
        photo: photoId ? hubPhoto(photoId, locale) : null,
        parks: group.parks.filter(linked),
      };
    });
  if (cards.length === 0) return null;
  const title = ownWords(tRegion, 'resorts.title') ?? t('resorts.title');

  return (
    <section id="resorts" className="scroll-mt-24">
      <ChapterHeading index={index} icon={MapPinned} title={title} />
      <ul
        className={cn(
          'grid gap-4 sm:grid-cols-2',
          cards.length === 3 && 'lg:grid-cols-3',
          cards.length >= 4 && 'lg:grid-cols-4'
        )}
      >
        {cards.map((card) => (
          <li key={card.key} className="flex">
            <article
              data-card=""
              className="group border-border/60 bg-card hover:border-primary/40 flex w-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div
                className={cn(
                  'relative overflow-hidden',
                  cards.length <= 2 && 'lg:aspect-[5/2]',
                  card.photo
                    ? 'aspect-[16/9]'
                    : 'from-primary/25 via-primary/10 to-status-operating/15 bg-gradient-to-br pt-10 sm:aspect-[16/9] sm:pt-0'
                )}
              >
                {card.photo && (
                  <Image
                    src={card.photo.src}
                    alt={card.photo.alt}
                    width={card.photo.width}
                    height={card.photo.height}
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 300px"
                    className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105"
                    style={{ objectPosition: card.photo.position }}
                  />
                )}
                {!card.photo && (
                  <MapPinned
                    aria-hidden
                    strokeWidth={1.25}
                    className="text-primary/20 absolute top-1/2 right-4 size-24 -translate-y-1/2 max-sm:hidden"
                  />
                )}
                {card.photo && (
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                  />
                )}
                <h3
                  className={cn(
                    'text-lg font-semibold',
                    card.photo
                      ? 'absolute inset-x-3 bottom-2 text-white drop-shadow'
                      : 'px-4 pb-2 sm:absolute sm:inset-x-4 sm:bottom-2 sm:p-0'
                  )}
                >
                  {card.name}
                </h3>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                {card.lead && <p className="text-sm leading-relaxed">{card.lead}</p>}
                {card.parks.length > 0 && (
                  <ul className="-mx-2 flex flex-col" {...linkBlockAttributes('trip_parks')}>
                    {card.parks.map((park) => (
                      <li key={park.slug} className="flex flex-col">
                        <Link
                          href={parkCalendarHref(park, locale)}
                          prefetch={false}
                          {...linkEntityAttributes(park.id)}
                          className="text-primary-ink hover:bg-primary/10 flex min-h-11 items-center justify-between gap-2 rounded-lg px-2 text-sm font-medium transition-colors sm:min-h-9"
                        >
                          {t('parksIndex.link', { park: shortParkName(park.name) })}
                          <ChevronRight aria-hidden className="size-4 shrink-0 opacity-60" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {card.stay && (
                  <p className="text-muted-foreground mt-auto flex gap-2 text-xs leading-relaxed">
                    <BedDouble aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>{card.stay}</span>
                  </p>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
