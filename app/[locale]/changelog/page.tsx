import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { Info } from 'lucide-react';
import { SITE_URL, localeToOpenGraphLocale } from '@/i18n/config';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { getDateTimeFormat } from '@/lib/utils/intl-format';
import { cn } from '@/lib/utils';
import { getChangelogEntries } from '@/lib/changelog';
import { CHANGELOG_PATH } from '@/lib/changelog/paths';
import { ChangelogIndex } from '@/components/changelog/changelog-index';
import { ChangelogRelease } from '@/components/changelog/changelog-release';
import { LandingHero } from '@/components/marketing/editorial-ui';
import { PageContainer } from '@/components/common/page-container';
import { PANEL_FLAT } from '@/components/common/glass-card';

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
const monthYear = () =>
  getDateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
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

  const latest = entries[0];
  const first = entries[entries.length - 1];
  const stats = [
    { value: String(entries.length), label: 'Releases' },
    { value: latest.version, label: 'Latest version' },
    { value: monthYear().format(new Date(`${first.date}T00:00:00Z`)), label: 'First release' },
  ];

  return (
    <>
      <LandingHero
        variant="compact"
        kicker="Release notes"
        title={HEADING}
        tagline="Every park.fan version since the first site in June 2025, newest first, with its release date and what changed for visitors. Blog and news posts are content, so you will find them in the feed and not here."
        aside={
          <dl className={cn('grid grid-cols-3 gap-4 rounded-2xl border p-6 shadow-sm', PANEL_FLAT)}>
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-muted-foreground text-xs tracking-wide uppercase">{s.label}</dt>
                <dd className="text-foreground mt-1 font-mono text-2xl font-bold tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      {/*
        One column below `lg`. From `lg` the version index gets a sticky column of its own on the
        left, so a reader far down the page can still jump to a version; from `xl` the releases
        hang on a timeline whose dots `ChangelogRelease` draws.
      */}
      <PageContainer className="grid gap-8 pt-8 pb-16 sm:pt-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:row-span-2">
          <ChangelogIndex entries={entries.map(({ version, date }) => ({ version, date }))} />
        </aside>

        <p
          className={cn(
            'text-muted-foreground flex gap-3 rounded-2xl border p-4 text-sm leading-relaxed',
            PANEL_FLAT
          )}
        >
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Entries marked &ldquo;Reconstructed&rdquo; were written in September 2026 from the
            commit history. Most of their version numbers and dates are the ones the code carried at
            the time, and where the version moved with almost every push, one entry covers a few of
            them. Where the code kept one number for weeks, the numbers in between were assigned
            when the history was written: 2.8.2, 2.8.3, 2.10.2 to 2.10.5, and 2.11.1 to 2.11.6 for
            the five weeks before 2.12.0 was cut.
          </span>
        </p>

        <div className="before:bg-border relative flex min-w-0 flex-col gap-12 xl:pl-10 xl:before:absolute xl:before:top-2 xl:before:bottom-2 xl:before:left-0 xl:before:w-px">
          {entries.map((entry, i) => (
            <ChangelogRelease key={entry.version} entry={entry} latest={i === 0} />
          ))}
        </div>
      </PageContainer>
    </>
  );
}
