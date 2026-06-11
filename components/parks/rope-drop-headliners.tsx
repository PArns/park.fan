import { Sunrise, Moon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { isEveningBetter, troughWait } from '@/lib/utils/rope-drop';
import type { ParkAttraction, RopeDropHeadliner } from '@/lib/api/types';

interface RopeDropHeadlinersProps {
  headliners: RopeDropHeadliner[];
  /** All park attractions, used to resolve URLs and derive the evening picks. */
  attractions: ParkAttraction[];
  parkPath: string;
}

function attractionHref(attraction: ParkAttraction, parkPath: string): string {
  const converted = attraction.url ? convertApiUrlToFrontendUrl(attraction.url) : null;
  return converted && converted !== '#' ? converted : `${parkPath}/${attraction.slug}`;
}

/**
 * "Worth arriving at park opening" strip on the park page, plus the inverse
 * picks ("better saved for the evening"). The API delivers `ropeDropHeadliners`
 * pre-filtered (worth=true) and sorted by savings desc; the evening picks are
 * derived from the attractions' ropeDrop data (see isEveningBetter). Full
 * details live on each attraction's detail page.
 */
export function RopeDropHeadliners({ headliners, attractions, parkPath }: RopeDropHeadlinersProps) {
  const t = useTranslations('parks.ropeDropSection');

  const items = headliners
    .map((h) => {
      const attraction = attractions.find((a) => a.id === h.attractionId);
      if (!attraction) return null;
      return { ...h, href: attractionHref(attraction, parkPath) };
    })
    .filter((item): item is RopeDropHeadliner & { href: string } => item !== null);

  const eveningItems = attractions
    .filter((a) => a.ropeDrop && isEveningBetter(a.ropeDrop))
    .map((a) => ({
      id: a.id,
      name: a.name,
      wait: troughWait(a.ropeDrop!),
      savedVsPeak: a.ropeDrop!.endOfDaySavings ?? null,
      href: attractionHref(a, parkPath),
    }))
    .sort((a, b) => (b.savedVsPeak ?? 0) - (a.savedVsPeak ?? 0));

  if (items.length === 0 && eveningItems.length === 0) return null;

  return (
    <section
      // w-fit + max-w keeps the panel clear of the search input, which sits
      // absolutely at the top right of the attractions tab on md+.
      className="border-border/50 bg-background/60 w-fit rounded-xl border p-4 shadow-md backdrop-blur-md md:max-w-[calc(100%-320px)] dark:bg-[oklch(0.12_0.025_241_/_0.55)]"
      aria-label={t('title')}
    >
      <div className="mb-1 flex items-center gap-2">
        <Sunrise className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold">
          <GlossaryTermLink termId="rope-drop">{t('title')}</GlossaryTermLink>
        </h3>
      </div>
      {items.length > 0 && (
        <>
          <p className="text-muted-foreground mb-3 text-xs">{t('description')}</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Link
                key={item.attractionId}
                href={item.href as '/parks/europe/germany/rust/europa-park'}
                prefetch={false}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  item.strength === 'high'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'
                    : 'border-teal-500/30 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300'
                )}
              >
                <span>{stripNewPrefix(item.name)}</span>
                <span className="font-bold whitespace-nowrap tabular-nums">
                  {t('save', { minutes: item.savings })}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
      {eveningItems.length > 0 && (
        <>
          <p
            className={cn('text-muted-foreground mb-3 flex items-center gap-1.5 text-xs', {
              'mt-3': items.length > 0,
            })}
          >
            <Moon className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden="true" />
            {t('eveningDescription')}
          </p>
          <div className="flex flex-wrap gap-2">
            {eveningItems.map((item) => (
              <Link
                key={item.id}
                href={item.href as '/parks/europe/germany/rust/europa-park'}
                prefetch={false}
                className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-500/20 dark:text-indigo-300"
              >
                <span>{stripNewPrefix(item.name)}</span>
                {item.wait != null && (
                  <span className="font-bold whitespace-nowrap tabular-nums">
                    {t('eveningWait', { minutes: item.wait })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
