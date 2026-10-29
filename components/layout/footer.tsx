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
import { InstallAppButton } from '@/components/common/install-app-button';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { getCurrentYear } from '@/lib/utils/server-time';
import { NEWS_INDEX_PATH } from '@/lib/blog/paths';
import { CHANGELOG_PATH } from '@/lib/changelog/paths';
import { rankedFirst } from '@/lib/parks/viewed-parks';
import { viewedParksSeed } from '@/lib/parks/viewed-parks-seed';
import type { Locale } from '@/i18n/config';
import { linkBlockAttributes } from '@/lib/analytics/internal-link';

/** The wait-time sources the footer credits, in the order the imprint lists them. */
const DATA_SOURCES: { href: string; label: string; prefix?: string }[] = [
  { href: 'https://themeparks.wiki', label: 'ThemeParks.wiki' },
  { href: 'https://queue-times.com/', prefix: 'Powered by', label: 'Queue-Times.com' },
  { href: 'https://wartezeiten.app', label: 'Wartezeiten.app' },
];

const SOURCE_LINK_PROPS = { target: '_blank', rel: 'noopener noreferrer' } as const;

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

/**
 * The site footer: popular parks by country, tools, content, legal and data-source links, feed,
 * preferred-source and install buttons, copyright, the build version and the disclaimer as its last
 * line. Server Component; the blog and news links show only when those sections have posts.
 */
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

  /**
   * The four countries of the popular-parks columns, in the order their columns stand, each with
   * its hand-picked parks: the column's length, and what fills it where this locale's readers have
   * opened too few of the country's parks (see `popularParks` below).
   */
  const curatedParks: {
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

  // Each column lists the country's parks this locale's readers opened most, as the build saw it
  // (`viewedParksSeed`): a snapshot, because the footer is in every page and a fetch here would put
  // its cache window on all of them. The country is the last segment of the column's hub path.
  const viewed = viewedParksSeed(locale);
  const popularParks = curatedParks.map((country) => {
    const countrySlug = country.href.split('/').pop();
    const ranked = viewed
      .filter((park) => park.countrySlug === countrySlug)
      .map((park) => ({ href: park.href, label: park.name }));
    return {
      ...country,
      parks: rankedFirst(ranked, country.parks, (park) => park.href, country.parks.length),
    };
  });

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
                The feed's only visible link on the site. A plain <a>, not the i18n `Link`: the
                target is a route handler, and a client navigation to it fetches an RSC payload
                that does not exist. Inside `showBlog` because the feed 404s under the same
                condition.
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
          `/favorites` and `/alerts` report this browser's own state; both are `noindex` and in no
          sitemap, so this list is what links them from every page.
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
    <footer className="bg-card border-t" role="contentinfo" {...linkBlockAttributes('footer')}>
      <div className="container mx-auto px-4 pt-8 pb-6 sm:py-12">
        <div className="grid gap-8 md:grid-cols-6">
          <div className="@container space-y-3 sm:space-y-4 md:col-span-2">
            <Link
              href="/"
              /* Both halves are ink-tight artwork, so the whole gap is in the class. */
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
            <InstallAppButton />
            {/* Where the column is narrower than 20rem the links stack and the bullets go: a
                wrapping row puts a „•" at the end or start of a line. Two links off the site, so
                a list and not a `<nav>`, which is for the site's own navigation. */}
            <ul
              className="text-muted-foreground flex flex-col items-start gap-1.5 text-sm max-sm:gap-0 @min-[20rem]:flex-row @min-[20rem]:flex-wrap @min-[20rem]:items-center @min-[20rem]:gap-1.5"
              aria-label={t('sections.resources')}
            >
              <li>
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
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="text-muted-foreground/60 hidden @min-[20rem]:inline"
                >
                  •
                </span>
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
              </li>
            </ul>
          </div>

          {/* Popular parks: one column per country, each under the same rule the link columns
              below draw (`MenuSectionHeading`) and with the same link class. The heading is the
              country's hub page. One `<nav>` for the four, as a four-column grid inside the
              brand's six, so each column is exactly as wide as a cell of the outer grid was. */}
          <nav
            aria-label={t('sections.popularParks')}
            className="hidden gap-8 md:col-span-4 md:grid md:grid-cols-4"
          >
            {popularParks.map((country) => (
              <div key={country.key}>
                <MenuSectionHeading label={country.label} href={country.href} />
                <ul className="flex flex-col" aria-label={country.label}>
                  {country.parks.map((park) => (
                    <li key={park.href} className="flex flex-col">
                      <Link
                        href={park.href as '/'}
                        prefetch={false}
                        className={`text-muted-foreground ${footerLinkClass}`}
                      >
                        {park.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator className="my-6 sm:my-8" />

        {/* The same six columns and 2/4 split as the block above the separator, so the link
            columns start where „Beliebte Parks" starts and the copyright sits under the brand. */}
        <div className="text-muted-foreground grid gap-6 text-sm sm:gap-8 md:grid-cols-6">
          <div className="flex flex-col items-center text-center md:col-span-2 md:items-start md:text-left">
            <p>{t('copyright', { year: currentYear })}</p>
            <BuildInfo />
          </div>
          <div className="flex w-full flex-col gap-6 md:col-span-4">
            {/* Named columns, so no `•` is left at the end of a line and the grid decides
                where groups break: two by two until `xl`, where four fit beside the brand. Each heading is `MenuSectionHeading` without `href`: a group
                here is not a hub page. Every link keeps `max-sm:min-h-11`, the button scale's
                phone tier. Below `sm` each column folds into one 44 px row (`FooterLinkGroup`),
                with the links still in the HTML. */}
            <nav
              className="grid w-full sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6 xl:grid-cols-4"
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
              {/* Queue-Times' terms ask for this exact wording, linked, somewhere prominent, and
                  Open-Meteo's CC BY 4.0 for a link to the licence; the imprint alone is noindex. */}
              <FooterLinkGroup heading={t('dataSources')}>
                {DATA_SOURCES.map((source) => (
                  <a
                    key={source.href}
                    href={source.href}
                    {...SOURCE_LINK_PROPS}
                    className="hover:text-foreground py-1 text-sm transition-colors max-sm:flex max-sm:min-h-11 max-sm:items-center"
                  >
                    {/* One child, so the flex row below `sm` cannot swallow the space after
                        the prefix. */}
                    <span>
                      {source.prefix && `${source.prefix} `}
                      <span className="whitespace-nowrap">
                        {source.label}
                        <ExternalLink
                          className="ml-1 inline size-3 align-[-1px]"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="sr-only"> ({t('opensInNewTab')})</span>
                  </a>
                ))}
                <span className="inline-flex flex-wrap items-center gap-x-1 py-1 text-sm max-sm:min-h-11">
                  <a
                    href="https://open-meteo.com/"
                    {...SOURCE_LINK_PROPS}
                    className="hover:text-foreground"
                  >
                    Open-Meteo.com
                    <ExternalLink className="ml-1 inline size-3 align-[-1px]" aria-hidden="true" />
                    <span className="sr-only"> ({t('opensInNewTab')})</span>
                  </a>
                  <span className="text-muted-foreground/80">
                    ({t('weatherSource')},{' '}
                    <a
                      href="https://creativecommons.org/licenses/by/4.0/"
                      {...SOURCE_LINK_PROPS}
                      className="hover:text-foreground underline-offset-2 hover:underline"
                    >
                      CC BY 4.0
                    </a>
                    )
                  </span>
                </span>
              </FooterLinkGroup>
            </nav>
          </div>
        </div>

        {/* No rule of its own below `sm`: the last folded row above already draws one. */}
        <p className="text-muted-foreground/80 border-border/60 mt-8 text-center text-sm leading-relaxed sm:border-t sm:pt-6">
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  );
}
