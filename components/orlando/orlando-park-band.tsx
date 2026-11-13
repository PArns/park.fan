import { getTranslations } from 'next-intl/server';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { catchNonFatal } from '@/lib/api/client';
import { withSeedTimeout } from '@/lib/api/seed-timeout';
import { cn } from '@/lib/utils';
import { getOrlandoRegion } from '@/lib/orlando/api';
import { ORLANDO_CALENDAR_ID, orlandoPath } from '@/lib/orlando/paths';

/**
 * How long a park page waits for the region before it leaves the band out: the read is a day in
 * the Data Cache, so only a cold cache after a deploy can take longer.
 */
const REGION_TIMEOUT_MS = 1500;

/**
 * The way from an Orlando park's page and its crowd calendar to the hub: "Several days in Orlando?
 * Which park on which day". Which parks get it is the region's own park list, read from the API's
 * day-cached `/trip-regions/orlando`, so no list of slugs lives here. Every other park renders
 * nothing, and so does a park page whose region read did not answer in time.
 */
export async function OrlandoParkBand({
  parkPath,
  className,
}: {
  /** The park's locale-free path, `/parks/<continent>/<country>/<city>/<park>`. */
  parkPath: string;
  className?: string;
}) {
  const region = await withSeedTimeout(catchNonFatal(getOrlandoRegion()), REGION_TIMEOUT_MS);
  if (!region?.parks.some((p) => p.path === parkPath)) return null;
  const t = await getTranslations('orlando.band');
  return (
    <aside
      data-card=""
      className={cn(
        'border-border/60 bg-background/70 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-3 backdrop-blur-md',
        className
      )}
    >
      <CalendarDays aria-hidden className="text-primary size-5 shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{t('title')}</p>
      <Link
        href={`${orlandoPath()}#${ORLANDO_CALENDAR_ID}`}
        className="text-primary-ink inline-flex min-h-11 items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline sm:min-h-0"
      >
        {t('link')}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </aside>
  );
}
