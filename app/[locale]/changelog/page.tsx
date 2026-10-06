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
 * The public changelog, at `/en/changelog`. English only by decision, so `generateStaticParams`
 * yields `en` alone and `dynamicParams` is off. It sits under `[locale]` for the chrome; the other
 * spellings and the bare `/changelog` are redirected in `next.config.ts`, which runs before the
 * proxy that would otherwise send a German visitor to a route that does not exist.
 *
 * No `<RouteMessages>`: the route's namespace delta is empty, and `pnpm check:client-messages`
 * fails on a wrapper that ships nothing.
 */

export const dynamicParams = false;

const PAGE_PATH = CHANGELOG_PATH;
const HEADING = 'Changelog';
/**
 * The `<title>` and the shared card. The locale layout's template is a bare `%s`, so a page that
 * wants the brand in its tab says so itself, the way `/blog` and `/fancast` do with
 * `{ absolute }`.
 */
const TITLE = 'Changelog: versions and release dates | park.fan';
const DESCRIPTION =
  'Every park.fan version since June 2025 with its release date, from the first dashboard to the trip planner and the in-park compass.';

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
      One column below `lg`. From `lg` the version index gets a sticky column of its own on the
      left, so a reader far down the page can still jump to a version; the article column keeps
      the 48 rem measure the blog reads at.
    */
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[12rem_minmax(0,48rem)] lg:justify-center lg:gap-x-12 lg:gap-y-14">
      <header className="lg:col-start-2">
        <div className="text-primary mb-4 flex size-12 items-center justify-center rounded-2xl border">
          <ScrollText className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{HEADING}</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed sm:text-lg">
          Every park.fan version since the first site in June 2025, newest first, with its release
          date and what changed for visitors. Blog and news posts are content, so you will find them
          in the feed and not here.
        </p>
        <p className="text-muted-foreground mt-3 max-w-2xl text-sm leading-relaxed">
          Entries marked &ldquo;Reconstructed&rdquo; were written in September 2026 from the commit
          history. Most of their version numbers and dates are the ones the code carried at the
          time, and where the version moved with almost every push, one entry covers a few of them.
          Where the code kept one number for weeks, the numbers in between were assigned when the
          history was written: 2.8.2, 2.8.3, 2.10.2 to 2.10.5, and 2.11.1 to 2.11.6 for the five
          weeks before 2.12.0 was cut.
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
