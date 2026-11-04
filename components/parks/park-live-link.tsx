import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/config';

/**
 * The link from a park's sub-page (statistics, crowd calendar) to the park page, worded
 * "<park>: Wartezeiten live". Google showed those sub-pages for "<park> wartezeiten", which the park
 * page answers; a link with the park's name and the query's words in its text says which page that
 * is. The words come from `parks.liveLink`, which the homepage tour links its park with too.
 */
export async function ParkLiveLink({
  href,
  park,
  locale,
}: {
  href: string;
  park: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'parks' });
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="text-primary mt-3 inline-flex text-sm font-medium underline-offset-4 hover:underline"
    >
      {t('liveLink', { park })}
      <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}
