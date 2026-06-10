import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

/**
 * Conventional discovery path — feed readers and humans try /rss.xml first.
 * The real per-locale feed lives at /<locale>/blog/feed.xml; this just
 * points there for the default locale.
 */
export function GET() {
  redirect(`/${defaultLocale}/blog/feed.xml`);
}
