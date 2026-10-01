import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ExternalLink, Rss } from 'lucide-react';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import { FooterLinkGroup } from '@/components/layout/footer-link-group';
import { BuildInfo } from '@/components/common/build-info';
import { PreferredSourceButton } from '@/components/common/preferred-source-button';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { getCurrentYear } from '@/lib/utils/server-time';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';
import { CHANGELOG_PATH } from '@/lib/changelog/paths';
import type { Locale } from '@/i18n/config';

interface FooterProps {
  locale: string;
  /** Whether the blog has at least one published post. */
  showBlog?: boolean;
  /**
   * The news section's label in this locale, when it lists anything — the same word the header's
   * entry and the overview's heading use (`categories.json`). Absent → no news link.
   */
  newsLabel?: string;
}

export async function Footer({ locale, showBlog = true, newsLabel }: FooterProps) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];
  const bestTimePath = '/' + BEST_TIME_SEGMENTS[locale as Locale];
  const howtoPath = '/' + HOWTO_SEGMENTS[locale as Locale];
  const plannerPath = '/' + PLANNER_SEGMENTS[locale as Locale];
  const tGeo = await getTranslations({ locale, namespace: 'geo' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const currentYear = await getCurrentYear();

  const footerLinkClass =
    'hover:text-foreground inline-flex items-center gap-1 py-1 text-sm transition-colors max-sm:min-h-11';

  /** The four countries of the popular-parks columns, in the order their columns stand. */
  const popularParks: {
    key: string;
    label: string;
    href: string;
    parks: { href: string; label: string }[];
  }[] = [
    {
      key: 'germany',
      label: t('sections.germany'),
      href: '/parks/europe/germany',
      parks: [
        { href: '/parks/europe/germany/rust/europa-park', label: 'Europa-Park' },
        { href: '/parks/europe/germany/bruehl/phantasialand', label: 'Phantasialand' },
        { href: '/parks/europe/germany/soltau/heide-park', label: 'Heide-Park' },
        { href: '/parks/europe/germany/bottrop/movie-park-germany', label: 'Movie Park Germany' },
        { href: '/parks/europe/netherlands/kaatsheuvel/efteling', label: 'Efteling' },
      ],
    },
    {
      key: 'usa',
      label: t('sections.usa'),
      href: '/parks/north-america/united-states',
      parks: [
        {
          href: '/parks/north-america/united-states/orlando/magic-kingdom-park',
          label: 'Magic Kingdom',
        },
        {
          href: '/parks/north-america/united-states/orlando/universal-studios-florida',
          label: 'Universal Studios',
        },
        {
          href: '/parks/north-america/united-states/tampa/busch-gardens-tampa',
          label: 'Busch Gardens Tampa',
        },
        {
          href: '/parks/north-america/united-states/anaheim/disneyland-park',
          label: 'Disneyland',
        },
        {
          href: '/parks/north-america/united-states/santa-clarita/six-flags-magic-mountain',
          label: 'Six Flags Magic Mountain',
        },
      ],
    },
    {
      key: 'france',
      label: tGeo('countries.france'),
      href: '/parks/europe/france',
      parks: [
        { href: '/parks/europe/france/paris/disneyland-park', label: 'Disneyland Paris' },
        { href: '/parks/europe/france/plailly/parc-asterix', label: 'Parc Asterix' },
        {
          href: '/parks/europe/france/paris/disney-adventure-world',
          label: 'Disney Adventure World',
        },
        {
          href: '/parks/europe/france/chasseneuil-du-poitou/futuroscope',
          label: 'Futuroscope',
        },
        { href: '/parks/europe/france/dolancourt/nigloland', label: 'Nigloland' },
      ],
    },
    {
      key: 'japan',
      label: tGeo('countries.japan'),
      href: '/parks/asia/japan',
      parks: [
        { href: '/parks/asia/japan/tokyo/tokyo-disneyland', label: 'Tokyo Disneyland' },
        { href: '/parks/asia/japan/tokyo/tokyo-disneysea', label: 'Tokyo DisneySea' },
        {
          href: '/parks/asia/japan/osaka/universal-studios-japan',
          label: 'Universal Studios Japan',
        },
      ],
    },
  ];

  /** The groups the closing link list is drawn from, in the order their columns stand. */
  const linkGroups: {
    key: string;
    heading: string;
    items: {
      key: string;
      href: string;
      label: string;
      plain?: boolean;
      icon?: ReactNode;
      /** The target's language, where it is not the page's own. */
      hrefLang?: string;
    }[];
  }[] = [
    {
      key: 'content',
      heading: t('sections.content'),
      items: [
        ...(showBlog
          ? [
              { key: 'blog', href: '/blog', label: t('blog') },
              ...(newsLabel ? [{ key: 'news', href: NEWS_INDEX_PATH, label: newsLabel }] : []),
              /*
                The feed's only visible link on the site. The `<head>` link autodiscovery needs has
                been there all along, which no person can see and no reader shows you until you
                have already found the page — so a visitor who wanted the feed had nothing to
                click. A plain <a>, not the i18n `Link`: the target is a route handler, and a
                client-side navigation to one fetches an RSC payload that does not exist. Inside
                `showBlog` because the feed 404s under exactly the same condition.
              */
              {
                key: 'feed',
                href: `/${locale}/blog/feed.xml`,
                label: t('feed'),
                plain: true,
                icon: <Rss className="size-3.5" aria-hidden="true" />,
              },
            ]
          : []),
        { key: 'glossary', href: glossaryPath, label: t('glossaryLink') },
        /*
          The changelog exists at `/en/changelog` only (`app/[locale]/changelog/page.tsx`), so
          every locale links the English page, and the five other labels say so in their own
          language. A plain <a> rather than the i18n `Link`: the target is in another locale,
          and `/de/changelog` would only reach it through a 308.
        */
        {
          key: 'changelog',
          href: CHANGELOG_PATH,
          label: t('changelog'),
          plain: true,
          hrefLang: 'en',
        },
      ],
    },
    {
      key: 'tools',
      heading: t('sections.tools'),
      items: [
        { key: 'fancast', href: '/fancast', label: t('fancast') },
        { key: 'bestTime', href: bestTimePath, label: t('bestTime') },
        { key: 'howto', href: howtoPath, label: t('howto') },
        { key: 'planner', href: plannerPath, label: t('planner') },
        /*
          `/favorites` and `/alerts` are the two pages that report this browser's own state. Both
          are `noindex` and in no sitemap, so nothing else links to them from every page — and
          until this list did, `/favorites` was reachable only from the header panel, and only
          while the band had something left to hide. A link a visitor can bookmark belongs where
          the rest of the site's fixed destinations are.
        */
        { key: 'favorites', href: '/favorites', label: t('favorites') },
        { key: 'alerts', href: '/alerts', label: t('alerts') },
      ],
    },
    {
      key: 'legal',
      heading: t('sections.legal'),
      items: [
        { key: 'impressum', href: '/impressum', label: t('impressum') },
        { key: 'datenschutz', href: '/datenschutz', label: t('datenschutz') },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t" role="contentinfo">
      <div className="container mx-auto px-4 pt-8 pb-6 sm:py-12">
        <div className="grid gap-8 md:grid-cols-6">
          {/* Brand */}
          <section className="@container space-y-3 sm:space-y-4 md:col-span-2">
            <Link
              href="/"
              /* Both halves are ink-tight artwork now, so the whole gap is in the class.
                 It used to be `gap-1.5` plus what the two files carried: ~3.5/5.25 px of empty
                 wordmark on its left, ~1.1/1.7 px of empty pin on its right. Optically 11.1 px
                 and 13.7 px, which is what these two round up to. */
              className="inline-flex items-center gap-3 md:gap-3.5"
              aria-label={`park.fan: ${tNav('home')}`}
            >
              <Image
                src="/logo.svg"
                width={26}
                height={32}
                alt="park.fan"
                className="h-8 w-auto shrink-0 md:h-12 dark:hidden"
                aria-hidden="true"
              />
              <Image
                src="/logo-dark.svg"
                width={26}
                height={32}
                alt="park.fan"
                className="hidden h-8 w-auto shrink-0 md:h-12 dark:block"
                aria-hidden="true"
              />
              <Image
                src="/parkfan.svg"
                width={105}
                height={25}
                alt="park.fan"
                className="h-[25px] w-auto md:h-[38px] dark:hidden"
              />
              <Image
                src="/parkfan-dark.svg"
                width={105}
                height={25}
                alt="park.fan"
                className="hidden h-[25px] w-auto md:h-[38px] dark:block"
              />
            </Link>
            <p className="text-muted-foreground text-base leading-normal sm:leading-relaxed">
              {t('description')}
            </p>
            <PreferredSourceButton />
            {/* One row needs 293–313 px across the six locales (measured at 1280 px with the row
                held to `nowrap`). Where the column is narrower than 20rem the links stack and the
                bullets go: a wrapping row put a „•" at the end of a line at 320 px, and at 768 px
                at the start of one. */}
            <nav
              className="text-muted-foreground flex flex-col items-start gap-1.5 text-sm max-sm:gap-0 @min-[20rem]:flex-row @min-[20rem]:flex-wrap @min-[20rem]:items-center @min-[20rem]:gap-1.5"
              aria-label={t('sections.resources')}
            >
              <a
                href="https://api.park.fan/api"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors max-sm:min-h-11"
              >
                {t('api')}
                <span className="sr-only"> ({t('opensInNewTab')})</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <span className="text-muted-foreground/60 hidden @min-[20rem]:inline">•</span>
              <a
                href="https://github.com/PArns"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors max-sm:min-h-11"
              >
                GitHub
                <span className="sr-only"> ({t('opensInNewTab')})</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
              <span className="text-muted-foreground/60 hidden @min-[20rem]:inline">•</span>
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors max-sm:min-h-11"
              >
                Arns.dev
                <span className="sr-only"> ({t('opensInNewTab')})</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </nav>
          </section>

          {/* Popular parks: one column per country, each under the same rule the link columns
              below draw (`MenuSectionHeading`) and with the same link class. The heading is the
              country's hub page. The „Beliebte Parks" label stays in each list's `aria-label`. */}
          {popularParks.map((country) => (
            <section key={country.key} className="hidden md:block">
              <MenuSectionHeading label={country.label} href={country.href} />
              <nav
                className="flex flex-col"
                aria-label={`${t('sections.popularParks')}: ${country.label}`}
              >
                {country.parks.map((park) => (
                  <Link
                    key={park.href}
                    href={park.href as '/'}
                    prefetch={false}
                    className={`text-muted-foreground ${footerLinkClass}`}
                  >
                    {park.label}
                  </Link>
                ))}
              </nav>
            </section>
          ))}
        </div>

        <Separator className="my-6 sm:my-8" />

        <div className="mb-4 text-center sm:mt-4 sm:mb-6">
          <p className="text-muted-foreground/80 text-sm">{t('disclaimer')}</p>
        </div>

        {/* The same six columns and the same 2/4 split as the block above the separator, so the
            link columns start where „Beliebte Parks" starts and the copyright sits under the
            brand. As a `flex … justify-between` row the three link columns sat against the right
            edge with the copyright's own column nearly 1000 px wide and empty under two lines of
            text. */}
        <div className="text-muted-foreground grid gap-6 text-sm sm:gap-8 md:grid-cols-6">
          <div className="flex flex-col items-center text-center md:col-span-2 md:items-start md:text-left">
            <p>{t('copyright', { year: currentYear })}</p>
            <BuildInfo />
          </div>
          <div className="flex w-full flex-col gap-6 md:col-span-4">
            {/* Three named columns, and the names are what keep a `•` off the end of a line. This
                was a flat `flex flex-wrap gap-2` row: eleven links with a `<span>•</span>` between
                each pair, breaking wherever the width ran out, so the separator behind the last
                link of a line stayed on that line with nothing after it. A column needs no
                separator, and where the groups break is the grid's decision rather than the
                browser's.

                The rule over each column is `MenuSectionHeading`, the one the header's menu bands
                already draw over theirs. Without `href`: a category here names two to six links
                and is not a hub page anybody could open.

                Every link keeps `max-sm:min-h-11`. They were bare `text-sm` with no padding at
                all — a 14 px font on a 20 px line box — and two of the eleven are Impressum and
                Datenschutz. Above `sm` the footer keeps its density, the same split as the button
                scale's phone tier.

                Below `sm` each column folds into one 44 px row (`FooterLinkGroup`, PAR-437): open,
                the three stood as 438 px of rows in a 1,102 px footer. The links stay in the HTML
                either way. */}
            <nav
              className="grid w-full sm:grid-cols-3 sm:gap-x-8 sm:gap-y-6"
              aria-label={t('siteSections')}
            >
              {linkGroups.map((group) => (
                <FooterLinkGroup key={group.key} heading={group.heading}>
                  {group.items.map((item) =>
                    item.plain ? (
                      <a
                        key={item.key}
                        href={item.href}
                        hrefLang={item.hrefLang}
                        className={footerLinkClass}
                      >
                        {item.icon}
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.key}
                        href={item.href as '/'}
                        prefetch={false}
                        className={footerLinkClass}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    )
                  )}
                </FooterLinkGroup>
              ))}
            </nav>
            {/* `gap-1` because the word and the name are two flex items, and the space between
                them in the source was collapsing: the line read "Powered byArns.dev". The gap
                disappears with the span below `md`, where only the name shows. Not drawn at all
                below `sm`: the same link is the last one in the brand block at the top. */}
            <p className="max-sm:hidden md:text-right">
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="hover:text-foreground inline-flex items-center gap-1 transition-colors max-sm:min-h-11"
              >
                <span className="hidden md:inline">{t('poweredBy')}</span> Arns.dev
                <span className="sr-only"> ({t('opensInNewTab')})</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
