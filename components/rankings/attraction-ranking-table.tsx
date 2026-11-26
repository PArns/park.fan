import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CardFrame } from '@/components/parks/park-stats-frame';
import { RANK_STYLES } from '@/components/parks/park-stats-attractions-card';
import { cn } from '@/lib/utils';
import type { RankedAttraction } from '@/lib/api/rankings';

/** Numeric columns share one width so the figures line up. */
const VALUE_CELL = 'w-[5rem] py-2 pr-2 text-right tabular-nums';

/**
 * A country's year ranking as a table: place, ride (with its park under it), the peak the order
 * follows, the typical wait and the measured days. A phone keeps place, ride and peak; the other
 * two columns would not fit beside a ride name. Server-rendered, every row in the first HTML.
 */
export async function AttractionRankingTable({ attractions }: { attractions: RankedAttraction[] }) {
  const t = await getTranslations('rankings');
  return (
    <CardFrame>
      {/* border-separate: the collapsed default drops the rounded corners off the hovered row. */}
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="text-muted-foreground/70 text-xs font-medium">
            <th scope="col" className="w-10 pb-2 pl-2 text-left font-medium">
              {t('colRank')}
            </th>
            <th scope="col" className="pb-2 text-left font-medium">
              {t('colRide')}
            </th>
            <th scope="col" className={cn(VALUE_CELL, 'pb-2 font-medium')}>
              {t('colP90')}
            </th>
            <th scope="col" className={cn(VALUE_CELL, 'hidden pb-2 font-medium sm:table-cell')}>
              {t('colP50')}
            </th>
            <th scope="col" className={cn(VALUE_CELL, 'hidden pb-2 font-medium md:table-cell')}>
              {t('colDays')}
            </th>
          </tr>
        </thead>
        <tbody>
          {attractions.map((a) => {
            const parkPath = `/parks/${a.continentSlug}/${a.countrySlug}/${a.citySlug}/${a.parkSlug}`;
            return (
              <tr
                key={`${a.parkSlug}/${a.attractionSlug}`}
                className="hover:bg-primary/5 transition-colors [&>*:first-child]:rounded-l-lg [&>*:last-child]:rounded-r-lg"
              >
                <td className="py-2 pl-2">
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                      RANK_STYLES[a.rank] ?? 'bg-muted/40 text-muted-foreground'
                    )}
                  >
                    {a.rank}
                  </span>
                </td>
                {/* `max-w-0`: the cell shrinks so the numeric columns get their width first,
                    which gives `truncate` a finite width. */}
                <td className="max-w-0 py-1.5 pr-3">
                  <Link
                    href={`${parkPath}/${a.attractionSlug}`}
                    prefetch={false}
                    className="hover:text-primary block truncate font-medium transition-colors"
                  >
                    {a.attractionName}
                  </Link>
                  <Link
                    href={parkPath}
                    prefetch={false}
                    className="text-muted-foreground hover:text-primary block truncate text-xs transition-colors"
                  >
                    {a.parkName}
                  </Link>
                </td>
                <td className={cn(VALUE_CELL, 'font-semibold')}>
                  {a.avgWaitP90}{' '}
                  <span className="text-muted-foreground font-normal">{t('minutes')}</span>
                </td>
                <td className={cn(VALUE_CELL, 'text-foreground/70 hidden sm:table-cell')}>
                  {a.avgWaitP50} {t('minutes')}
                </td>
                <td className={cn(VALUE_CELL, 'text-foreground/70 hidden md:table-cell')}>
                  {a.sampleDays}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </CardFrame>
  );
}
