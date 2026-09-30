import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ScrollText } from 'lucide-react';
import { SITE_URL, localeToOpenGraphLocale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getChangelogEntries } from '@/lib/changelog';
import { CHANGELOG_PATH } from '@/lib/changelog/paths';
import { ChangelogIndex } from '@/components/changelog/changelog-index';
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

const PAGE_PATH = CHANGELOG_PATH;
/** The heading on the page. */
const HEADING = 'Changelog';
/**
 * The `<title>` and the shared card. The locale layout's template is a bare `%s`, so a page that
 * wants the brand in its tab says so itself, the way `/blog` and `/fancast` do with
 * `{ absolute }`. It was the single word "Changelog" until 2.13.0.
 */
const TITLE = 'Changelog: versions and release dates | park.fan';
const DESCRIPTION =
  'Every park.fan version since June 2025 with its release date: new pages, new data on park and ride pages, and what was fixed.';

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export async function generateMetadata(): Promise<Metadata> {
  const ogImageUrl = getOgImageUrl(['en', 'changelog']);

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      locale: localeToOpenGraphLocale.en,
      url: `${SITE_URL}${PAGE_PATH}`,
      siteName: 'park.fan',
      type: 'website',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: HEADING }],
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
    /*
      One column below `lg`: intro, the version index, the releases. From `lg` the index moves
      into a column of its own on the left and stays in view (`ChangelogIndex`), so a reader far
      down the page can still jump to a version. The article column keeps the 48 rem it had as
      the whole page, which is the measure the blog reads at.
    */
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[12rem_minmax(0,48rem)] lg:justify-center lg:gap-x-12 lg:gap-y-14">
      <header className="lg:col-start-2">
        <div className="text-primary mb-4 flex size-12 items-center justify-center rounded-2xl border">
          <ScrollText className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{HEADING}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
          Every park.fan version since the first site in June 2025, newest first, with its release
          date and what changed for visitors. A version collects everything that shipped since the
          one before it. Blog and news posts are content, so you will find them in the feed and not
          here.
        </p>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Entries marked &ldquo;Reconstructed&rdquo; were written in September 2026 from the commit
          history. Their version numbers and dates are the ones the code carried at the time, and
          where the version moved with almost every push, one entry covers the whole run.
        </p>
      </header>

      <aside className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <ChangelogIndex entries={entries} />
      </aside>

      <div className="flex flex-col gap-10 lg:col-start-2">
        {entries.map((entry) => (
          <ChangelogRelease key={entry.version} entry={entry} />
        ))}
      </div>
    </div>
  );
}
