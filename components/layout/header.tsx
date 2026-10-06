'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import type { Locale } from '@/i18n/config';
import {
  BookOpen,
  CalendarPlus,
  CalendarRange,
  ChevronDown,
  Compass,
  Ellipsis,
  House,
  Megaphone,
  Menu,
  Newspaper,
  RollerCoaster,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { NavMenu, NavEntryLabel, headerNavInk } from '@/components/layout/nav-menu';
import { ParksMenuPanel } from '@/components/layout/parks-menu-panel';
import { MoreMenuLinks } from '@/components/layout/more-menu-links';
import { MoreMenuPanel } from '@/components/layout/more-menu-panel';
import { BlogMenuPanel } from '@/components/layout/blog-menu-panel';
import { NewsMenuPanel } from '@/components/layout/news-menu-panel';
import { LatestNewsChip, latestNewsFrom } from '@/components/blog/latest-news-chip';
import { FavoritesMenu } from '@/components/layout/favorites-menu';
import { FavoritesMenuPanel } from '@/components/layout/favorites-menu-panel';
import { useSheetReveal } from '@/lib/hooks/use-menu-reveal';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { SearchCommand } from '@/components/search/search-bar';
import { PlannerHeaderButton } from '@/components/planner/planner-header-button';
import { HeaderNearbyPark } from '@/components/layout/header-nearby-park';
import { translateContinent } from '@/lib/i18n/helpers';
import type { GeoMenuContinent } from '@/lib/navigation/geo-menu';
import type { FeaturedParkCard } from '@/lib/navigation/featured-parks-menu';
import type { BlogMenu } from '@/lib/navigation/blog-menu';
import type { NewsMenu } from '@/lib/navigation/news-menu';
import type { MoreMenu } from '@/lib/navigation/more-menu';

/** Stable fallback, so a missing list does not defeat `ParksMenuPanel`'s memo. */
const NO_FEATURED_PARKS: FeaturedParkCard[] = [];

/**
 * Where a transparent hero bar turns solid, and where it turns back: a band rather than one line,
 * so a reader resting near the threshold does not flip the bar's glass on and off.
 */
const SOLID_ON_Y = 56;
const SOLID_OFF_Y = 44;

interface HeaderProps {
  /** Whether the blog has at least one published post — every blog link
   *  hides while the answer is no. Computed server-side in the layout. */
  showBlog?: boolean;
  /**
   * Continents and their countries for the parks menu, fetched in the layout and passed down
   * because this is a Client Component. See `lib/navigation/geo-menu.ts` for why it stops at
   * countries.
   */
  geoMenu?: GeoMenuContinent[];
  /** Categories + newest articles for the blog menu, read from the generated manifest. */
  blogMenu?: BlogMenu;
  /**
   * The news entry's label and the newest news for its panel, from the same manifest. No items →
   * no entry: news is its own section, not a corner of the blog (see `lib/navigation/news-menu.ts`).
   */
  newsMenu?: NewsMenu;
  /**
   * What the "more" menu lists: the dictionary's categories with translated labels, the chapters of
   * the guide and of the best-time hub, and a photo per hub. Resolved in the layout because this is
   * a Client Component, and the glossary namespace or the media catalog here would ship in the
   * chrome of every page. See `lib/navigation/more-menu.ts`.
   */
  moreMenu?: MoreMenu;
  /**
   * The photo rail in the parks menu, resolved in the layout so the media catalog stays out of this
   * Client Component and only the URLs cross the boundary.
   */
  featuredParks?: FeaturedParkCard[];
}

/** One destination in the phone sheet. */
function SheetNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      data-sheet-stagger
      className="hover:text-primary text-lg font-medium transition-colors"
    >
      <NavEntryLabel icon={icon} size="sheet">
        {children}
      </NavEntryLabel>
    </Link>
  );
}

/**
 * A destination in the phone sheet that opens onto what it holds: „Parks entdecken" onto the
 * continents, the dictionary onto its categories and the two hubs onto their chapters. A native
 * `<details>`, so it opens without JavaScript. The whole row is the toggle and the first link
 * inside is the destination, so a row is never two targets. `ml-2.5` and `pl-5` line the rule and
 * the links up with `NavEntryLabel`'s icon and label.
 */
function SheetDisclosure({
  icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group" data-sheet-stagger>
      <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between text-lg font-medium transition-colors">
        <NavEntryLabel icon={icon} size="sheet">
          {label}
        </NavEntryLabel>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-border/60 mt-2 ml-2.5 flex flex-col gap-2 border-l pl-5">
        {children}
      </div>
    </details>
  );
}

/**
 * A link inside a `SheetDisclosure`, with the number the desktop band gives the same row: a
 * chapter's place in its page before the label, a category's term count after it.
 */
function SheetSubLink({
  href,
  index,
  count,
  children,
}: {
  href: string;
  index?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href as '/'}
      prefetch={false}
      className="text-muted-foreground hover:text-foreground flex items-baseline gap-2 text-sm transition-colors"
    >
      {index && (
        <span className="text-primary/70 w-5 shrink-0 text-xs font-semibold tabular-nums">
          {index}
        </span>
      )}
      <span className="min-w-0 flex-1 text-pretty">{children}</span>
      {count != null && (
        <span className="text-muted-foreground/70 text-xs tabular-nums">{count}</span>
      )}
    </Link>
  );
}

/**
 * The 48 px site header: brand lockup, the parks, blog, news and more menus, favourites, nearby
 * park, planner, search, language, unit and theme controls, and the burger sheet on phones. Floats
 * transparent over full-bleed heroes until the page scrolls.
 */
export function Header({
  showBlog = true,
  geoMenu,
  blogMenu,
  newsMenu,
  featuredParks,
  moreMenu,
}: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const locale = useLocale();
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];
  const bestTimePath = '/' + BEST_TIME_SEGMENTS[locale as Locale];
  const howtoPath = '/' + HOWTO_SEGMENTS[locale as Locale];
  const plannerPath = '/' + PLANNER_SEGMENTS[locale as Locale];
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isFancast = pathname === '/fancast';
  // The hub uses localized slugs (usePathname is locale-stripped but keeps the
  // localized segment), so match against all of them.
  const isBestTime = Object.values(BEST_TIME_SEGMENTS).some((s) => pathname === '/' + s);
  // Same for the guide, which also opens on a full-bleed hero.
  const isHowto = Object.values(HOWTO_SEGMENTS).some((s) => pathname === '/' + s);
  // The blog index (not its sub-pages) opens with the same full-bleed hero.
  const isBlogIndex = pathname === '/blog';
  // Blog articles and news posts open with a full-bleed cover banner (always
  // dark: a cover image or a dark fallback gradient). The listing sub-pages
  // (category/tag/author, and the news overview) keep the normal header.
  const isBlogPost =
    pathname.startsWith('/news/') ||
    (pathname.startsWith('/blog/') &&
      !pathname.startsWith('/blog/category/') &&
      !pathname.startsWith('/blog/tag/') &&
      !pathname.startsWith('/blog/authors/'));
  // Pages that open with a full-bleed hero the header floats over: transparent at the top, solid on
  // scroll. Their heroes show the photo in natural colours under a glass panel, so the floating
  // logo follows the theme (`darkHero` stays off).
  const isHeroPage = isHomePage || isFancast || isBestTime || isHowto || isBlogIndex || isBlogPost;
  const darkHero = false;
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);

  /*
   * The burger sheet is controlled because it has to close itself: a `<Link>` navigates rather than
   * calling `SheetClose`, and the header survives the navigation. The state stores the path the
   * sheet was opened on, so a route change closes it during render. `pathname` is locale-stripped,
   * so a language switch keeps it open.
   */
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const mobileMenuOpen = menuOpenedOn === pathname;
  const setMobileMenuOpen = (next: boolean) => setMenuOpenedOn(next ? pathname : null);
  const sheetRef = useSheetReveal(mobileMenuOpen);
  const latestNews = latestNewsFrom(newsMenu, { excerpt: true });

  /*
   * A tap on a link to the page already showing changes no `pathname`, so that case closes the
   * sheet here: a plain click on a link in the sheet's own DOM whose path is the current one. A
   * locale switch keeps it open, and a modifier click still opens a tab.
   */
  const closeOnSamePageTap = (event: React.MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link || !event.currentTarget.contains(link) || link.target === '_blank') return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    if (new URL(link.href).pathname === window.location.pathname) setMobileMenuOpen(false);
  };

  useEffect(() => {
    // Only hero pages have a transparent-at-the-top header, so only they need the scroll listener
    // and the initial measurement.
    if (!isHeroPage) return;
    // A band, not a line: crossing the threshold snaps `backdrop-filter` on or off, and a single
    // line flips the bar's glass whenever a reader rests near it (momentum, a short drag, a
    // rubber-band bounce). An unchanged `setScrolled` is a React bail-out.
    // `scrollY` is read here and not inside the updater: React may call an updater more than once,
    // during render, where a layout read is in the wrong phase.
    const check = () => {
      const y = window.scrollY;
      setScrolled((was) => (was ? y > SOLID_OFF_Y : y > SOLID_ON_Y));
    };
    check();
    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        check();
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isHeroPage]);

  const isTransparent = isHeroPage && !scrolled;

  /*
   * The corner-to-bar handoff of the logo. The bar carries two copies of `BrandLockup`, one parked
   * in the corner while the header floats and one in the flex flow, and they travel the same path
   * in the same 500 ms, so at the midpoint they coincide and read as one object. Being the same
   * component, `logoScale` resolves to 1 and is only a safety net. Measured with
   * `offsetLeft`/`offsetWidth`/`offsetHeight`, which ignore transforms and so cannot feed back into
   * themselves, and re-measured on resize because the container is centred.
   */
  const cornerLogoRef = useRef<HTMLAnchorElement>(null);
  const barLogoRef = useRef<HTMLAnchorElement>(null);
  const [handoff, setHandoff] = useState({ logoShift: 0, logoScale: 1 });

  useEffect(() => {
    if (!isHeroPage) return;
    // One measurement per frame, and a commit only when a number moved: `resize` fires dozens of
    // times a second during a drag, and on phones whenever the address bar moves.
    let frame: number | null = null;
    const measure = () => {
      frame = null;
      const cornerLogo = cornerLogoRef.current;
      const barLogo = barLogoRef.current;
      if (!cornerLogo || !barLogo || barLogo.offsetHeight === 0) return;
      const logoShift = barLogo.offsetLeft - cornerLogo.offsetLeft;
      const logoScale = cornerLogo.offsetHeight / barLogo.offsetHeight;
      setHandoff((was) =>
        was.logoShift === logoShift && was.logoScale === logoScale ? was : { logoShift, logoScale }
      );
    };
    const onResize = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [isHeroPage]);

  const { logoShift, logoScale } = handoff;
  const handoffMotion = 'transition-[opacity,transform] duration-500 ease-out';
  const cornerLogoStyle = isTransparent
    ? undefined
    : { transform: `translateX(${logoShift}px) scale(${(1 / logoScale).toFixed(3)})` };
  const barLogoStyle = isTransparent
    ? { transform: `translateX(${-logoShift}px) scale(${logoScale.toFixed(3)})` }
    : undefined;
  // The nav's ink is the one thing the bar's two states decide about the navigation (see
  // `headerNavInk`). It switches with no delay, which is safe because the scrim and the solid
  // material are two layers cross-fading on `opacity`; a `transition-delay` would also delay every
  // entry's hover. See docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md.
  const navLinkClass = `text-sm font-medium transition-colors duration-200 ${headerNavInk(isTransparent)}`;

  return (
    <header
      /* No `backdrop-filter` on this element: it would become a backdrop root, and the menu band,
         which hangs under this header but paints below its box, would blur an empty backdrop. The
         bar's material lives in the sibling layer below. */
      /* `@container`, so the switches below ask how wide this bar is rather than the window: the
         trip planner's panel insets the page without the window changing. On the header and not
         the row, because `container-type` makes the corner logo (`absolute left-6`) resolve
         against it. `inline-size` does not imply `contain: paint`, so this is no backdrop root.
         See docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md. */
      className={`@container relative sticky top-0 z-50 h-12 border-b transition-[border-color] duration-500 ${
        isTransparent ? 'border-transparent' : 'border-border/50'
      }`}
    >
      {/* The bar's glass. `-z-10` keeps this positioned layer behind the row: a positioned element
          with `z-index: auto` paints above every non-positioned sibling, whatever the DOM order.
          The sticky `z-50` header is its own stacking context, so it cannot slip behind the page.
          Do not make the inner container `relative` instead: `MenuBand` resolves against the
          `<header>`. `backdrop-filter` is not in the transition list, since animating it
          re-rasterizes the blur behind the whole bar on every frame; the blur snaps and the colour
          fades. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 transition-[background-color] duration-500 ${
          isTransparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md'
        }`}
      />

      {/* The scrim: a ground for the nav over an arbitrary photo while the bar floats. A second
          layer rather than a second class list, because a gradient is `background-image`, which
          does not interpolate; two layers cross-fade on `opacity`, which is what lets the ink
          switch with no delay. It reaches 32 px below the bar and holds `background/85` over the
          bar's 48 px before fading, so it has no hard edge across the photo. Hero pages only. */}
      {isHeroPage && (
        <div
          aria-hidden="true"
          className={`from-background/85 pointer-events-none absolute inset-x-0 top-0 -bottom-8 -z-10 bg-gradient-to-b from-60% to-transparent transition-opacity duration-500 ${
            isTransparent ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div
        /* `h-full`, not a second `h-12`: the header's content box is 47 px (border-box), and the
           in-flow logo must centre on the same box as the corner copy. */
        /* The row's width comes from the header's container tiers, not from `container`, whose
           max-width follows the window while the planner shrinks the header. `px-4` is a floor
           rather than something the max-width replaces, so the lockup never sits flush against
           the screen edge at a tier boundary. */
        className="mx-auto flex h-full w-full items-center justify-between px-4 @min-[768px]:max-w-[768px] @min-[1024px]:max-w-[1024px] @min-[1280px]:max-w-[1280px] @min-[1536px]:max-w-[1536px]"
      >
        {/* Corner logo, visible only while the bar is transparent; hands over to the bar logo on
            scroll (see the handoff note above). `-translate-y-1/2` is Tailwind's standalone
            `translate` property, so the inline `transform` composes with it. */}
        <Link
          ref={cornerLogoRef}
          href="/"
          prefetch={false}
          style={cornerLogoStyle}
          className={`absolute top-1/2 left-6 flex origin-left -translate-y-1/2 items-center gap-2 motion-reduce:transform-none! ${handoffMotion} ${
            isTransparent ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          aria-label="park.fan - Home"
          tabIndex={isTransparent ? 0 : -1}
        >
          <BrandLockup forceLight={darkHero} />
        </Link>

        {/* Bar logo, in flex flow. It keeps the justify-between anchor while invisible, and the
            transform is layout-free. */}
        <Link
          ref={barLogoRef}
          href="/"
          prefetch={false}
          style={barLogoStyle}
          className={`flex shrink-0 origin-left items-center gap-2 motion-reduce:transform-none! ${handoffMotion} ${
            isTransparent ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
          aria-label="park.fan - Home"
          tabIndex={isTransparent ? -1 : 0}
        >
          <BrandLockup />
        </Link>

        {/* The navigation is never hidden by the bar's transparent state. One breakpoint for the
            whole bar: the nav starts where the search input does, and below it everything lives
            in the burger, the only arrangement that holds in all six languages.
            `whitespace-nowrap` keeps every label on one line in the 48 px bar; the search field
            beside it shrinks first. */}
        <nav
          className="hidden items-center gap-3.5 whitespace-nowrap @min-[1024px]:flex @min-[1280px]:gap-5"
          aria-label="Main navigation"
        >
          {/* The nearby park, drawn only within 5 km of one. Below a 1280 px bar it is the pin
              alone, with the name in its label and tooltip, because the chip does not fit the row
              in every locale; from 1280 the name comes back, truncated where the bar is narrow. */}
          <HeaderNearbyPark variant="bar" />
          {/* The order is the phone menu's: Backstage, News, Parks entdecken, „Mehr" where the
              sheet lists its three hubs, then the planner. No home entry, the logo is its link.
              Every entry carries its sheet icon (`NavEntryLabel`). */}

          {/* Backstage, the blog: an entry of its own rather than inside „Mehr", because it is
              the site's strongest SEO driver. A `NavMenu` with `href="/blog"` (a real `<a>` plus a
              chevron button, see NavMenu rule 2); without panel data, the bare link. */}
          {showBlog &&
            (blogMenu && blogMenu.recent.length > 0 ? (
              <NavMenu href="/blog" label={t('blog')} icon={Newspaper} floating={isTransparent}>
                <BlogMenuPanel {...blogMenu} />
              </NavMenu>
            ) : (
              <Link href="/blog" prefetch={false} className={navLinkClass}>
                <NavEntryLabel icon={Newspaper}>{t('blog')}</NavEntryLabel>
              </Link>
            ))}
          {/* News, an entry of its own beside Backstage, since the two sections share no post.
              Same pattern, `href="/news"` plus a chevron; no news, no entry. The label is the news
              category's (`categories.json`). */}
          {newsMenu && newsMenu.items.length > 0 && (
            <NavMenu
              href={newsMenu.path}
              label={newsMenu.label}
              icon={Megaphone}
              floating={isTransparent}
            >
              <NewsMenuPanel {...newsMenu} />
            </NavMenu>
          )}
          {geoMenu && geoMenu.length > 0 ? (
            <NavMenu
              href="/parks"
              label={t('explore')}
              icon={RollerCoaster}
              floating={isTransparent}
            >
              <ParksMenuPanel continents={geoMenu} featured={featuredParks ?? NO_FEATURED_PARKS} />
            </NavMenu>
          ) : (
            <Link href="/parks" prefetch={false} className={navLinkClass}>
              <NavEntryLabel icon={RollerCoaster}>{t('explore')}</NavEntryLabel>
            </Link>
          )}
          {/* „Mehr" holds „Beste Reisezeit", „Wörterbuch" and „So funktioniert's", which as
              entries of their own overflowed the row in French. `MenuBand` hides the panel rather
              than unmounting it, so the links stay in every page's HTML. No `href`: „Mehr" has no
              page of its own (NavMenu rule 2). */}
          <NavMenu label={t('more')} icon={Ellipsis} floating={isTransparent}>
            <MoreMenuPanel
              bestTimeHref={bestTimePath}
              glossaryHref={glossaryPath}
              howtoHref={howtoPath}
              menu={moreMenu}
            />
          </NavMenu>
          {/* The planner, last before the favourites, as in the phone menu. */}
          <Link href={plannerPath} prefetch={false} className={navLinkClass}>
            <NavEntryLabel icon={CalendarPlus}>{t('planner')}</NavEntryLabel>
          </Link>
          {/* The favourites stand in this row because they open the same band as „Parks
              entdecken" and „Mehr", with the same hover hysteresis. No link: their page answers
              every reader differently, see FavoritesMenu. */}
          <FavoritesMenu floating={isTransparent} />
        </nav>

        {/* The full input from `xl`. Below that the row has no width to spare —
            see the icon trigger further down, which covers 1024–1279 px. */}
        <div className="hidden @min-[1280px]:block @min-[1280px]:w-64">
          <SearchCommand
            trigger="input"
            size="sm"
            placeholder={tCommon('searchPlaceholderShort')}
            isGlobal
          />
        </div>

        {/* `max-sm:gap-1` is width, not taste: at 320 px the row only fits inside the
            container's padding with these gaps halved. */}
        <div className="flex items-center gap-2 max-sm:gap-1">
          {/* The icon trigger up to `xl`: the nav row cannot give width back, and a 36 px icon
              that opens the same palette costs nobody a search, while a horizontal scrollbar
              costs everybody. */}
          <div className="@min-[1280px]:hidden">
            <SearchCommand trigger="button" size="sm" />
          </div>

          {/* Locale, theme and unit. Below a 640 px bar they move into the burger sheet, where
              they are the first row: they are preferences set once, not navigation. The sheet copy
              is unconditional, because a portal cannot ask this container anything; between 640
              and 1023 they are in both places, which costs nothing. */}
          <div className="flex items-center gap-1 @max-[640px]:hidden">
            <LocaleSwitcher />
            <ThemeToggle />
            {/* The unit governs temperatures on every page, so it sits with the other
                preferences; see TemperatureUnitToggle for the row's width budget. */}
            <TemperatureUnitToggle />
          </div>

          {/* The planner's way in on a phone, where the edge tab is not drawn — see
              PlannerHeaderButton for why it asks `planner-phone` rather than this bar. */}
          <PlannerHeaderButton label={t('planner')} />

          <div>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  /* `max-sm:size-9` cancels the button scale's 44 px phone tier. The bar is
                     `h-12`; a 44 px burger in it is the mistake the header-geometry requirement
                     names. Third and last opt-out, beside LocaleSwitcher and the search trigger. */
                  className="max-sm:size-9 @min-[1024px]:hidden"
                  suppressHydrationWarning
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('menu')}</span>
                </Button>
              </SheetTrigger>
              {/* The scroll belongs to the nav, not the sheet: `SheetContent` positions the X, so
                  scrolling it would carry the X away. `overscroll-contain` stops a flick at the end
                  of the list from scrolling the page. `pt-2` puts the first row, the preferences,
                  in the X's own band. The `env(safe-area-inset-bottom)` half of `pb-1` reads 0
                  until the viewport opts into `viewport-fit=cover`. */}
              <SheetContent
                side="right"
                className="w-[300px] gap-0 px-6 pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pt-0.5"
              >
                {/* The landmark and the reveal's root span the list and the footer, so the footer
                    staggers in with the rows and its links sit in a navigation landmark. Still
                    `flex-1 min-h-0`, so the list inside can scroll. */}
                <nav
                  ref={sheetRef}
                  className="flex min-h-0 flex-1 flex-col"
                  aria-label={t('mobileNavigation')}
                  onClick={closeOnSamePageTap}
                >
                  <div
                    // `min-h-0`, or the flex item will not shrink below its content and the list
                    // spills out of the sheet instead of scrolling. `-mx-2 px-2` with
                    // `overflow-x-hidden`: `overflow-y: auto` makes `overflow-x` auto too, and the
                    // favourites rows bleed 8 px past their column; this keeps the bleed inside the
                    // box and hides the reveal's `x: 16` slide.
                    className="-mx-2 flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain px-2 pb-4"
                  >
                    {/* The three preferences the bar does not carry on a phone, first in the sheet
                      so saved favourites cannot push them out of sight; the same components as the
                      bar's. No visible label beside the 44 px X: the controls say what they are,
                      and the word stays for screen readers. `pr-12` keeps them clear of the X. */}
                    <div
                      data-sheet-stagger
                      role="group"
                      aria-label={t('preferences')}
                      className="border-border/60 flex min-h-11 items-center gap-1 border-b pr-12 pb-2"
                    >
                      <LocaleSwitcher />
                      <ThemeToggle />
                      <TemperatureUnitToggle />
                    </div>
                    <HeaderNearbyPark variant="sheet" />
                    {/* The newest news post, as the chip the homepage hero draws, from the news
                      menu's own data. */}
                    {latestNews && (
                      <div data-sheet-stagger>
                        <LatestNewsChip news={latestNews} variant="card" />
                      </div>
                    )}
                    {/* Favourites before the destinations: on a phone this sheet is the navigation,
                      and a returning visitor's own parks are the shortest route out of it. Radix
                      unmounts the contents on close, so `open` is always true here. */}
                    <div data-sheet-stagger className="border-border/60 border-b pb-4">
                      <FavoritesMenuPanel open variant="sheet" />
                    </div>
                    {/* Every entry leads with the icon its destination carries elsewhere, so the
                      sheet does not invent a second icon for a place that has one. */}
                    {showBlog && (
                      <SheetNavLink href="/blog" icon={Newspaper}>
                        {t('blog')}
                      </SheetNavLink>
                    )}
                    {newsMenu && newsMenu.items.length > 0 && (
                      <SheetNavLink href={newsMenu.path} icon={Megaphone}>
                        {newsMenu.label}
                      </SheetNavLink>
                    )}
                    <SheetNavLink href="/" icon={House}>
                      {t('home')}
                    </SheetNavLink>
                    {/* Discovery in the sheet. The countries stay out of it — the sheet is a
                      phone-sized column, and the continent hubs are one tap from the parks that
                      matter. */}
                    <SheetDisclosure icon={RollerCoaster} label={t('explore')}>
                      <SheetSubLink href="/parks">{t('parks')}</SheetSubLink>
                      {(geoMenu ?? []).map((continent) => (
                        <SheetSubLink key={continent.slug} href={`/parks/${continent.slug}`}>
                          {translateContinent(tGeo, continent.slug, locale, continent.name)}
                        </SheetSubLink>
                      ))}
                    </SheetDisclosure>
                    {/* The three hubs of the desktop "more" band, in its column order, each opening
                      onto its own page as the first row and then its categories or chapters.
                      Without the lists a hub is a plain link. */}
                    {moreMenu && moreMenu.glossary.categories.length > 0 ? (
                      <SheetDisclosure icon={BookOpen} label={t('glossary')}>
                        <SheetSubLink href={glossaryPath} count={moreMenu.glossary.termCount}>
                          {t('overview')}
                        </SheetSubLink>
                        {moreMenu.glossary.categories.map((category) => (
                          <SheetSubLink key={category.id} href={category.href}>
                            {category.label}
                          </SheetSubLink>
                        ))}
                      </SheetDisclosure>
                    ) : (
                      <SheetNavLink href={glossaryPath} icon={BookOpen}>
                        {t('glossary')}
                      </SheetNavLink>
                    )}
                    {moreMenu && moreMenu.bestTime.chapters.length > 0 ? (
                      <SheetDisclosure icon={CalendarRange} label={t('bestTime')}>
                        <SheetSubLink href={bestTimePath}>{t('overview')}</SheetSubLink>
                        {moreMenu.bestTime.chapters.map((chapter) => (
                          <SheetSubLink
                            key={chapter.href}
                            href={chapter.href}
                            index={chapter.index}
                          >
                            {chapter.label}
                          </SheetSubLink>
                        ))}
                      </SheetDisclosure>
                    ) : (
                      <SheetNavLink href={bestTimePath} icon={CalendarRange}>
                        {t('bestTime')}
                      </SheetNavLink>
                    )}
                    {moreMenu && moreMenu.howto.chapters.length > 0 ? (
                      <SheetDisclosure icon={Compass} label={t('howto')}>
                        <SheetSubLink href={howtoPath}>{t('overview')}</SheetSubLink>
                        {moreMenu.howto.chapters.map((chapter) => (
                          <SheetSubLink
                            key={chapter.href}
                            href={chapter.href}
                            index={chapter.index}
                          >
                            {chapter.label}
                          </SheetSubLink>
                        ))}
                      </SheetDisclosure>
                    ) : (
                      <SheetNavLink href={howtoPath} icon={Compass}>
                        {t('howto')}
                      </SheetNavLink>
                    )}
                    <SheetNavLink href={plannerPath} icon={CalendarPlus}>
                      {t('planner')}
                    </SheetNavLink>
                  </div>
                  {/* The same row as the foot of the "Mehr" panel, from one definition, smaller
                    because these are places visitors come across rather than look for. "Meine
                    Favoriten" is left out because the favourites panel above carries it. Outside
                    the scrolling list, so it stays on the bottom edge. */}
                  <MoreMenuLinks variant="sheet" />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
