import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { RANK_STYLES } from '@/components/parks/park-stats-attractions-card';
import { getParkBackground, getRideImage } from '@/lib/media';
import { getMediaAlt } from '@/lib/media/text';
import { objectPositionForSrc, versionedPath } from '@/lib/media/focus';
import { cn } from '@/lib/utils';
import type { RankedAttraction } from '@/lib/api/rankings';

/** How the photo strip is sized: three cards in a row from `sm`, one per row on a phone. */
const PODIUM_SIZES = '(min-width: 640px) 33vw, 100vw';

/**
 * The first three places as cards with the ride's photo, its park and the two figures. The ride's
 * own photo where the media database has one, else its park's; no photo, a tinted ground. Server
 * rendered, so the photos and the names are in the first HTML.
 */
export async function RankingPodium({ attractions }: { attractions: RankedAttraction[] }) {
  const t = await getTranslations('rankings');
  const locale = await getLocale();
  return (
    <ol className="mb-6 grid gap-3 sm:grid-cols-3">
      {attractions.map((a) => {
        const parkPath = `/parks/${a.continentSlug}/${a.countrySlug}/${a.citySlug}/${a.parkSlug}`;
        const park = { slug: a.parkSlug, url: parkPath };
        const image = getRideImage(park, a.attractionSlug) ?? getParkBackground(park);
        const src = image ? versionedPath(image.src) : null;
        return (
          <li key={`${a.parkSlug}/${a.attractionSlug}`}>
            <Link
              href={`${parkPath}/${a.attractionSlug}`}
              prefetch={false}
              className={cn(
                'group relative isolate flex h-full min-h-48 flex-col justify-end overflow-hidden rounded-2xl p-4 text-white sm:min-h-64',
                a.rank === 1 && 'ring-2 ring-amber-400/70'
              )}
            >
              {src ? (
                <Image
                  src={src}
                  alt={(image && getMediaAlt(image.id, locale)) ?? a.attractionName}
                  fill
                  sizes={PODIUM_SIZES}
                  className="-z-10 object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: objectPositionForSrc(src, '50% 50%') }}
                  priority={a.rank === 1}
                />
              ) : (
                <div className="from-primary/40 absolute inset-0 -z-10 bg-gradient-to-br to-zinc-900" />
              )}
              {/* The scrim keeps white text readable on any photo. */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
              <span
                className={cn(
                  'mb-auto inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums backdrop-blur',
                  RANK_STYLES[a.rank] ?? 'bg-black/40 text-white'
                )}
              >
                {a.rank === 1 ? <Trophy className="h-4 w-4" aria-label="1" /> : a.rank}
              </span>
              <h2 className="mt-6 text-lg leading-tight font-bold">{a.attractionName}</h2>
              <p className="text-sm text-white/75">{a.parkName}</p>
              <p className="mt-2 flex items-baseline gap-3 text-sm">
                <span>
                  <span className="text-2xl font-extrabold tabular-nums">{a.avgWaitP90}</span>{' '}
                  {t('minutes')} <span className="text-white/70">{t('colP90')}</span>
                </span>
                <span className="text-white/70">
                  {a.avgWaitP50} {t('minutes')} {t('colP50')}
                </span>
              </p>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
