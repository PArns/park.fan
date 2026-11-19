import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

/** One of a park's pages linked under another's intro, worded by its key in `parks`. */
async function ParkPageLink({
  href,
  park,
  locale,
  wordKey,
}: {
  href: string;
  park: string;
  locale: Locale;
  wordKey: 'liveLink' | 'calendarLink';
}) {
  const t = await getTranslations({ locale, namespace: 'parks' });
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="text-primary mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
    >
      {t(wordKey, { park })}
      <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}

/**
 * The link from a park's sub-page (statistics, crowd calendar) to the park page, worded
 * "<park>: Wartezeiten live". Google showed those sub-pages for "<park> wartezeiten", which the park
 * page answers; a link with the park's name and the query's words in its text says which page that
 * is. The words come from `parks.liveLink`, which the homepage tour links its park with too.
 */
export function ParkLiveLink(props: { href: string; park: string; locale: Locale }) {
  return <ParkPageLink {...props} wordKey="liveLink" />;
}

/**
 * The park page's link to its crowd calendar, worded "<park>: Andrangskalender & Auslastung der
 * nächsten Tage" (`parks.calendarLink`): Google showed the park page for "<park> auslastung", which
 * it answers for today, and the calendar for the days after it; the link says which is which.
 */
export function ParkCalendarLink(props: { href: string; park: string; locale: Locale }) {
  return <ParkPageLink {...props} wordKey="calendarLink" />;
}
