import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ScrollText } from 'lucide-react';
import { SITE_URL, localeToOpenGraphLocale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getChangelogEntries } from '@/lib/changelog';
import { ChangelogRelease } from '@/components/changelog/changelog-release';

/**
 * The public changelog, at `/en/changelog`.
 *
 * ## Why one locale, and why it still lives under `[locale]`
 *
 * The page is English only by decision: a release note is read by the handful
 * of people who follow the project, and five translations of it would be five
 * more things to keep true. `generateStaticParams` therefore yields `en`
 * alone and `dynamicParams` is off, so no other locale can build this route.
 *
 * It still sits under `[locale]` because that is where the chrome is: the
 * header, the footer and the locale provider are the segment's layout. A
 * sibling of `[locale]` would have to rebuild all three. The other five
 * spellings of the URL, and the bare `/changelog`, are redirected here in
 * `next.config.ts` rather than left to 404: `localePrefix: 'always'` means the
 * proxy would otherwise resolve `/changelog` against Accept-Language and land a
 * German visitor on a route that does not exist. `redirects()` runs before the
 * proxy (step 2 against step 3 in
 * `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`),
 * so it gets the request first.
 *
 * No `<RouteMessages>`: everything on the page is either content or an English
 * label, so the route's namespace delta is empty and `pnpm check:client-messages`
 * fails on a wrapper that ships nothing.
 */

export const dynamicParams = false;

const PAGE_PATH = '/en/changelog';
const TITLE = 'Changelog';
const DESCRIPTION =
  'What changed on park.fan, version by version: new pages, new data on the park and ride pages, and the fixes behind them.';

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const ogImageUrl = getOgImageUrl(['en', 'changelog']);

  return {
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      locale: localeToOpenGraphLocale.en,
      url: `${SITE_URL}${PAGE_PATH}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: TITLE }],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: [ogImageUrl],
    },
    // No `languages` map: the page exists in one language, and an hreflang set
    // listing five URLs that 404 is worse than none at all.
    alternates: {
      canonical: `${SITE_URL}${PAGE_PATH}`,
    },
  };
}

export default async function ChangelogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const entries = getChangelogEntries();
  // Nothing published yet is a 404 rather than an empty page: an indexable URL
  // with a heading and no content is a page Google keeps and nobody wants.
  if (entries.length === 0) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-10 sm:mb-14">
        <div className="text-primary mb-4 flex size-12 items-center justify-center rounded-2xl border">
          <ScrollText className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{TITLE}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
          park.fan ships continuously, so a version here is not a deployment. It is a line drawn
          under everything that became visible since the last one. Blog posts are not releases and
          never appear below.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {entries.map((entry) => (
          <ChangelogRelease key={entry.version} entry={entry} />
        ))}
      </div>
    </div>
  );
}
