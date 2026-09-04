import { getTranslations } from 'next-intl/server';
import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { plannerPath } from '@/lib/planner/segments';
import type { Locale } from '@/i18n/config';

/**
 * "Plan a day at this park", in the park's own header.
 *
 * The planner had exactly three inbound links and all three were site chrome:
 * the header nav, the burger and the footer. Nothing linked to it from the pages
 * that carry the intent — a visitor reading Phantasialand's wait times is the
 * person the feature is for, and the page said nothing about it. This is that
 * link, and it lands on the park page and the wait-time calendar together
 * because both are `ParkTitleHeader`.
 *
 * **The anchor names the park.** "Tag im Phantasialand planen" rather than "zum
 * Tagesplaner": anchor text is the strongest thing one page can say about
 * another, and 212 park pages saying "trip planner" would be 212 pages saying
 * the same four words. It also reads better, which is usually how you can tell.
 *
 * It is a PLAIN link and it navigates, which is a deliberate trade rather than
 * an oversight. Opening the panel on this park in place would be the better
 * gesture and the page already has two of those — the edge tab, and the
 * calendar's "plan this day" — while what was missing was a crawlable anchor and
 * a way in for somebody who has never seen the panel. A link that cancels its
 * own navigation would serve the crawler and lie to the reader.
 *
 * A Server Component, so the label costs no client bundle: `parks` is 15.1 KB
 * and this reads one key of it on the server.
 */
export async function ParkPlannerLink({
  parkName,
  locale,
  className,
}: {
  parkName: string;
  locale: Locale | string;
  className?: string;
}) {
  const t = await getTranslations('parks');

  return (
    <Link
      href={plannerPath(locale) as '/trip-planner'}
      data-park-planner-link=""
      className={
        className ??
        'bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors max-sm:min-h-11'
      }
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
      {t('planDayCta', { park: parkName })}
    </Link>
  );
}
