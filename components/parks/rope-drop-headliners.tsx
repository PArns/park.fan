import { Sunrise } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn, stripNewPrefix } from '@/lib/utils';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import type { ParkAttraction, RopeDropHeadliner } from '@/lib/api/types';

interface RopeDropHeadlinersProps {
  headliners: RopeDropHeadliner[];
  /** All park attractions, used to resolve each headliner's detail-page URL. */
  attractions: ParkAttraction[];
  parkPath: string;
}

/**
 * "Worth arriving at park opening" strip on the park page. The API delivers
 * `ropeDropHeadliners` pre-filtered (worth=true) and sorted by savings desc;
 * full details live on each attraction's detail page.
 */
export function RopeDropHeadliners({ headliners, attractions, parkPath }: RopeDropHeadlinersProps) {
  const t = useTranslations('parks.ropeDropSection');

  const items = headliners
    .map((h) => {
      const attraction = attractions.find((a) => a.id === h.attractionId);
      if (!attraction) return null;
      const converted = attraction.url ? convertApiUrlToFrontendUrl(attraction.url) : null;
      const href = converted && converted !== '#' ? converted : `${parkPath}/${attraction.slug}`;
      return { ...h, href };
    })
    .filter((item): item is RopeDropHeadliner & { href: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <section
      // w-fit + max-w keeps the panel clear of the search input, which sits
      // absolutely at the top right of the attractions tab on md+.
      className="border-border/50 bg-background/60 w-fit rounded-xl border p-4 shadow-md backdrop-blur-md md:max-w-[calc(100%-320px)] dark:bg-[oklch(0.12_0.025_241_/_0.55)]"
      aria-label={t('title')}
    >
      <div className="mb-1 flex items-center gap-2">
        <Sunrise className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
        <h3 className="text-sm font-semibold">{t('title')}</h3>
      </div>
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
    </section>
  );
}
