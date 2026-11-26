import { getTranslations } from 'next-intl/server';
import { Castle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ChapterHeading } from '@/components/common/chapter-heading';
import type { RankedAttraction } from '@/lib/api/rankings';

interface ParkTally {
  key: string;
  name: string;
  path: string;
  count: number;
  best: number;
}

/**
 * The listed rides counted per park, most first, each with its best place: which parks the long
 * queues come from, at a glance. Counts only the rides the page lists.
 */
export function tallyParks(attractions: RankedAttraction[]): ParkTally[] {
  const byPark = new Map<string, ParkTally>();
  for (const a of attractions) {
    const key = `${a.continentSlug}/${a.countrySlug}/${a.citySlug}/${a.parkSlug}`;
    const entry = byPark.get(key);
    if (entry) {
      entry.count += 1;
      entry.best = Math.min(entry.best, a.rank);
    } else {
      byPark.set(key, { key, name: a.parkName, path: `/parks/${key}`, count: 1, best: a.rank });
    }
  }
  return [...byPark.values()].sort((x, y) => y.count - x.count || x.best - y.best);
}

/** The park tally as a row of cards under its own heading. */
export async function RankingParks({ attractions }: { attractions: RankedAttraction[] }) {
  const t = await getTranslations('rankings');
  const parks = tallyParks(attractions);
  const most = parks[0]?.count ?? 1;
  return (
    <section className="mt-10">
      <ChapterHeading
        icon={Castle}
        title={t('parksTitle', { count: attractions.length })}
        className="mb-3"
      />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {parks.map((park) => (
          <li key={park.key}>
            <Link
              href={park.path}
              prefetch={false}
              className="bg-card/60 hover:border-primary/40 block rounded-xl border p-3 transition-colors"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate font-medium">{park.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {t('parkBest', { rank: park.best })}
                </span>
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span className="bg-primary/10 h-1.5 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-primary block h-full rounded-full"
                    style={{ width: `${(park.count / most) * 100}%` }}
                  />
                </span>
                <span className="text-xs tabular-nums">
                  {t('parkRides', { count: park.count })}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
