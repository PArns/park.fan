'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import type { Locale } from '@/i18n/config';
import { Menu, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { BrandLockup } from '@/components/layout/brand-lockup';
import { NavMenu, headerNavInk } from '@/components/layout/nav-menu';
import { ParksMenuPanel } from '@/components/layout/parks-menu-panel';
import { MoreMenuLinks } from '@/components/layout/more-menu-links';
import { MoreMenuPanel } from '@/components/layout/more-menu-panel';
import { BlogMenuPanel } from '@/components/layout/blog-menu-panel';
import { FavoritesMenu } from '@/components/layout/favorites-menu';
import { FavoritesMenuPanel } from '@/components/layout/favorites-menu-panel';
import { useSheetReveal } from '@/lib/hooks/use-menu-reveal';
import { ThemeToggle } from '@/components/common/theme-toggle';
import { TemperatureUnitToggle } from '@/components/common/temperature-unit-toggle';
import { LocaleSwitcher } from '@/components/common/locale-switcher';
import { SearchCommand } from '@/components/search/search-bar';
import { PlannerHeaderButton } from '@/components/planner/planner-header-button';
import { useHomeNearbyParks } from '@/lib/hooks/use-nearby-parks';
import { useMounted } from '@/lib/hooks/use-mounted';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { translateContinent } from '@/lib/i18n/helpers';
import type { NearbyParksData } from '@/types/nearby';
import type { GeoMenuContinent } from '@/lib/navigation/geo-menu';
import type { FeaturedParkCard } from '@/lib/navigation/featured-parks-menu';
import type { BlogMenu } from '@/lib/navigation/blog-menu';
import type { GlossaryMenu } from '@/lib/navigation/glossary-menu';

/** API returns distance in meters. Only show "Nearby: Park" when nearest park is within this (m). */
const NEAR_PARK_HEADER_RADIUS_M = 5000; // 5 km

/**
 * Where a transparent hero bar turns solid, and where it turns back — two numbers, not one.
 *
 * They straddle the 50 px this used to test on both sides. See the `check` they are used in for
 * why a single line is the wrong shape for a threshold that switches a `backdrop-filter`.
 */
const SOLID_ON_Y = 56;
const SOLID_OFF_Y = 44;

interface HeaderProps {
  /** Whether the blog has at least one published post — every blog link
   *  hides while the answer is no. Computed server-side in the layout. */
  showBlog?: boolean;
  /**
   * Continents and their countries for the parks menu. Fetched in the layout (a cached discovery
   * read, not a per-page request) and passed down because this is a Client Component. 28 links,
   * 420 B brotli — see `lib/navigation/geo-menu.ts` for why it stops at countries.
   */
  geoMenu?: GeoMenuContinent[];
  /** Categories + newest posts for the blog menu, read from the generated manifest. */
  blogMenu?: BlogMenu;
  /**
   * The dictionary's categories for the "more" menu, with their labels already translated.
   * Resolved in the layout for the same reason `featuredParks` is: this is a Client Component,
   * and `useTranslations('glossary')` in here would put the whole 2,402 B namespace into the
   * chrome of every page for 358 B of labels.
   */
  glossaryMenu?: GlossaryMenu;
  /**
   * The photo rail in the parks menu. Resolved in the layout because `@/lib/media` is the 107 KB
   * catalog and this is a Client Component — only four URLs cross the boundary.
   */
  featuredParks?: FeaturedParkCard[];
}

export function Header({
  showBlog = true,
  geoMenu,
  blogMenu,
  featuredParks,
  glossaryMenu,
}: HeaderProps) {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const tGeo = useTranslations('geo');
  const locale = useLocale();
  const glossaryPath = '/' + GLOSSARY_SEGMENTS[locale as Locale];
  // The header has always KNOWN this route — `isBestTime` below uses it to float the bar over
  // the hub's hero — and never linked it. Same localized segment, now also a destination.
  const bestTimePath = '/' + BEST_TIME_SEGMENTS[locale as Locale];
  const howtoPath = '/' + HOWTO_SEGMENTS[locale as Locale];
  const plannerPath = '/' + PLANNER_SEGMENTS[locale as Locale];
  const pathname = usePathname();
  const { data: nearbyData } = useHomeNearbyParks();
  const parks =
    nearbyData?.type === 'nearby_parks' ? (nearbyData.data as NearbyParksData).parks : [];
  const nearestPark = parks[0];
  /*
   * Erst nach dem Mount, wie überall an dieser Query.
   *
   * `useHomeNearbyParks` seedet aus `localStorage`, also gibt es die Pille auf dem Server nicht
   * und im ersten Client-Render eines Besuchers, der schon einmal in Parknähe war, schon — ein
   * Hydration-Fehler mitten im Header, nach dem React die ganze Leiste neu rendert. Auf einer
   * Maschine ohne Standort fällt das nie auf, weil die Pille dort nie erscheint.
   */
  const mounted = useMounted();
  const showNearbyPark =
    mounted && nearestPark != null && nearestPark.distance <= NEAR_PARK_HEADER_RADIUS_M;

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
  // Pages that open with a full-bleed hero the header floats over: transparent at
  // the top, solidifying to the normal bar on scroll. All of these heroes now show
  // the photo in its natural colours (no dark wash) with a frosted glass panel for
  // the text — like the park pages — so the floating logo follows the theme rather
  // than being forced light (`darkHero` stays off).
  const isHeroPage = isHomePage || isFancast || isBestTime || isHowto || isBlogIndex || isBlogPost;
  const darkHero = false;
  const [scrolled, setScrolled] = useState(false);
  const rafRef = useRef<number | null>(null);

  /*
   * The burger sheet is CONTROLLED, and the only reason is that it has to close itself.
   *
   * Radix closes a dialog when something inside it calls `SheetClose`, and a `<Link>` does not:
   * it navigates. The header lives in the locale layout and survives that navigation, so on a
   * phone the sheet stayed open across the route change — you tapped "Glossar", the page behind
   * the panel became the glossary, and the panel was still sitting on top of it. Every link in
   * there had the bug; nobody could reach the page they had just asked for without also finding
   * the X.
   *
   * `pathname` is the signal, and it is what the state STORES — the path the sheet was opened
   * on, so a route change closes it during render rather than one `setState`-in-an-effect later.
   * It comes from `@/i18n/navigation`, so it is locale-stripped, which is right here: switching
   * language re-renders the same route and should not slam the menu shut mid-gesture.
   */
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const mobileMenuOpen = menuOpenedOn === pathname;
  const setMobileMenuOpen = (next: boolean) => setMenuOpenedOn(next ? pathname : null);
  const sheetRef = useSheetReveal(mobileMenuOpen);

  useEffect(() => {
    // Only hero pages have a transparent-at-the-top header, so only they need the scroll
    // listener — and only they need the initial measurement (on every other page `scrolled`
    // is unused, and calling `check()` here queued a pointless state update + re-render of
    // the whole header on each navigation).
    if (!isHeroPage) return;
    // A BAND, not a line, and the reason is written two comments down: crossing the threshold
    // snaps `backdrop-filter` on or off, and the note on the bar's glass already says that it
    // "repeats on every direction change up there". A single 50 px line means a reader resting
    // anywhere near it — trackpad momentum settling, a short drag, a rubber-band bounce — flips
    // the bar's glass on and off, which is the most prominent piece of glass on the page.
    //
    // 12 px of hysteresis is enough that no ordinary scroll oscillates across both edges, and
    // small enough that the handoff still happens where it always did: the bar solidifies at
    // 56 px on the way down and goes transparent again at 44 px on the way up, against the 50 px
    // both used to share. `setScrolled` with an unchanged value is a React bail-out, so the
    // steady state still costs nothing.
    // `scrollY` is read HERE and not inside the updater: React may call an updater more than
    // once and does it during render, so reading the document from inside one is both impure and
    // a layout read in the wrong phase.
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
   * The nav's ink, and it is the only thing the bar's two states still decide about the
   * navigation. `headerNavInk` holds both halves and the arithmetic behind them, because the row
   * has three kinds of entry and they must not drift apart. The bar's other controls need no
   * branch: the search trigger and the burger are ghost `Button`s, and the locale switcher and the
   * theme toggle carry no colour of their own, so all four inherit `foreground`. The °C/°F toggle
   * is the one that does — `text-muted-foreground` on its own pill — and it is left alone on
   * purpose: it reads the same on both states of the bar, and the 85 % scrim it sits on while the
   * bar floats is a better ground than the 80 % it has had on every page since it was built.
   *
   * **It switches with the state and waits for nothing**, which took two attempts to get right.
   * The worry is the way DOWN: muted ink arriving before the ground it is safe on. That was real
   * while the scrim and the solid material were one layer — the scrim is `background-image`, which
   * does not interpolate, so it vanished at the threshold and left about a quarter of a ground
   * under muted labels for a third of a second. Two layers cross-fading on `opacity` fixed that at
   * the source: their sum runs 85 % → ~65 % → 80 %, i.e. never far from the 80 % the solid bar has
   * always given muted ink while a hero is still behind it.
   *
   * A `delay-300` on the solid class list was the first fix and is the wrong one: `transition-delay`
   * is one property and the hover rule shares it, so it would have delayed the hover of all seven
   * entries by 300 ms on every page in the app. A timer in state is worse — a `setState` in an
   * effect, which this project's lint rule refuses for good reason. Neither is worth buying 200 ms
   * of 65 % instead of 80 %.
   */

  /*
   * The corner-to-bar handoff of the logo.
   *
   * The bar carries two copies of the lockup: one parked in the corner while the header floats
   * over the hero, one in the flex flow once it solidifies. Cross-fading the pair looked like
   * exactly what it was — one thing disappearing while a second one appeared somewhere else,
   * at a different size on the left.
   *
   * The pair now travels the same path in the same 500 ms: the outgoing copy slides to where the
   * incoming one lives, the incoming one starts at the corner. At the midpoint the two coincide,
   * so the eye reads one object moving.
   *
   * "Coincide" is a claim about geometry, and it used to be false. Both copies render
   * `<BrandLockup>` now, so they are congruent by construction and `logoScale` resolves to 1.000 —
   * a pure translate, nothing rasterized at one size and painted at another. The scale is kept in
   * the formula as the safety net it was meant to be: if the two ever diverge again the handoff
   * still lands, it just costs a blur. Before the shared component it was carrying a 1.5× on every
   * desktop hero page, and even that could not reconcile the two — a single factor cannot fix a
   * pin:wordmark ratio of 36:24 against 24:20, so the corner copy stayed ~25 px wider than the bar
   * copy the whole way across (measured at 1440: 147.2 px against 122.2 px).
   *
   * The logo is left-aligned, so the path is measured from the left edges and scales from
   * `origin-left` — away from the screen edge, with its left edge on the path.
   *
   * **There used to be a second pair**, the locale + theme cluster, parked in a frosted pill at
   * `right-6` while the bar floated. It is gone, and the reason is this change rather than taste:
   * once the search trigger and the burger are visible from the first screen line, they are drawn
   * at their flex positions on the right — which is exactly where that pill hangs. Measured at
   * 360 px the pill spanned 240–336 px against the burger's 308–344 and the actions box's
   * 216–304; at 1024 and 1280 it lay over the search control. Two copies of the same three
   * preference controls, one of them painted across the burger, is not a handoff. The in-flow
   * cluster is simply always there now, which also spares every hero page a second hydration of
   * `LocaleSwitcher`, `ThemeToggle` and `TemperatureUnitToggle`.
   *
   * Every number is measured, never guessed, and always from `offsetLeft`/`offsetWidth`/
   * `offsetHeight` — layout values, which ignore the transforms, so a measurement can never feed
   * back into itself the way `getBoundingClientRect()` would. The container is centred, so the
   * distances depend on the viewport and are re-measured on resize.
   */
  const cornerLogoRef = useRef<HTMLAnchorElement>(null);
  const barLogoRef = useRef<HTMLAnchorElement>(null);
  const [handoff, setHandoff] = useState({ logoShift: 0, logoScale: 1 });

  useEffect(() => {
    if (!isHeroPage) return;
    const measure = () => {
      const cornerLogo = cornerLogoRef.current;
      const barLogo = barLogoRef.current;
      if (!cornerLogo || !barLogo || barLogo.offsetHeight === 0) return;
      setHandoff({
        logoShift: barLogo.offsetLeft - cornerLogo.offsetLeft,
        logoScale: cornerLogo.offsetHeight / barLogo.offsetHeight,
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isHeroPage]);

  const { logoShift, logoScale } = handoff;
  const handoffMotion = 'transition-[opacity,transform] duration-500 ease-out';
  const cornerLogoStyle = isTransparent
    ? undefined
    : { transform: `translateX(${logoShift}px) scale(${(1 / logoScale).toFixed(3)})` };
  const barLogoStyle = isTransparent
    ? { transform: `translateX(${-logoShift}px) scale(${logoScale.toFixed(3)})` }
    : undefined;
  const navLinkClass = `text-sm font-medium transition-colors duration-200 ${headerNavInk(isTransparent)}`;

  return (
    <header
      /* No `backdrop-filter` on this element, and that is load-bearing rather than tidy.
         An element carrying one becomes a BACKDROP ROOT: a descendant with its own
         `backdrop-filter` then samples only what was painted inside that root. The mega-menu band
         hangs in the DOM under this header but paints below its box, where the root has painted
         nothing — so the band's 24 px blur blurred an empty backdrop and the glass was simply not
         there. The bar's own material moved into the sibling layer below, which blurs the page
         exactly as before and is nobody's ancestor. */
      /* `@container`, so the four visibility switches below ask how wide THIS BAR
         is rather than how wide the window is. The two stopped being the same
         number when the trip planner's panel started insetting the page: the
         wrapper in `app/[locale]/layout.tsx` pads the page by the panel's width,
         so with a 448 px panel on a 1440 px window the bar's box is 992 px while
         `lg:`/`xl:` still read 1440 and kept handing it a desktop's worth of
         content. Measured then: children summing 1087.9 px in a 992 px box, the
         °C/°F toggle and the theme switch 95.9 px UNDER the panel in German and
         171.1 px in French, and worse at 1280 (+255.9) and 1024 (+389.7),
         because the panel is a fixed width and the box it leaves shrinks with
         the window.

         On the HEADER and not on the row inside it: `container-type` makes an
         element the containing block for absolutely positioned descendants, and
         the corner logo is `absolute left-6` — against the row (which is
         `container mx-auto`, i.e. 1280 wide and centred in a 1440 window) it
         would sit 80 px further right and break the handoff the whole lockup
         geometry is built on. The header is already `relative`, so nothing about
         that resolution changes here.

         `container-type: inline-size` implies `contain: layout style
         inline-size` and NOT `contain: paint`, which is what would have made
         this element a backdrop root — see the note above about why the bar's
         material lives in a sibling layer. Measured after the change: the menu
         band's blur is unchanged.

         The thresholds are the old ones on purpose. With the planner shut the
         header spans the viewport, so 1024 and 1280 as container queries are the
         same two switches at the same two window widths — the bar keeps every
         layout it had, and only gains the ones it needs while the panel is
         open. */
      className={`@container relative sticky top-0 z-50 h-12 border-b transition-[border-color] duration-500 ${
        isTransparent ? 'border-transparent' : 'border-border/50'
      }`}
    >
      {/* The bar's glass.
          `-z-10` is not decoration, it is the whole reason this layer works. Being first in the
          DOM does NOT put it behind its siblings: in CSS painting order a POSITIONED element with
          `z-index: auto` paints above every non-positioned in-flow descendant, so an
          `absolute inset-0` sheet covers the bar's contents. It shipped that way and swallowed
          the logo, the locale switcher and both chevrons the moment the bar solidified — while the
          nav links, the search field and the favorites star stayed visible, because the header
          reveal's GSAP transform was on those and a transform makes each of them its own
          stacking context that escapes above the sheet. "Everything without a transform
          disappears" is what that bug looked like from the outside. That reveal is gone with
          PAR-170 and nothing in the bar carries a transform of its own any more, so the `-z-10`
          is now the only thing holding the material behind the row.
          The header is `sticky` with `z-index: 50`, so it is a stacking context of its own and a
          negative z-index here cannot slip behind the page — it lands between the header's own
          (transparent) background and its contents, which is exactly where a material belongs.
          Making the inner container `relative` instead would also fix the painting, and must not
          be done: `MenuBand` is absolutely positioned and resolves against the `<header>`, which
          is what keeps the full-width band from being measured off a trigger.
          `backdrop-filter` is deliberately NOT in the transition list: animating it made the
          browser re-rasterize the blur of everything behind the full-width bar on every frame for
          500 ms each time the scroll crossed the 50 px threshold — by far the most expensive
          repaint on the hero pages, and it repeats on every direction change up there. The blur
          snaps on/off (barely perceptible: the bar is still transparent when the fade starts)
          while the colour keeps cross-fading. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 transition-[background-color] duration-500 ${
          isTransparent ? 'bg-transparent' : 'bg-background/80 backdrop-blur-md'
        }`}
      />

      {/* The scrim, and it is a SECOND layer rather than a second class list on the first.

          The transparent state is no longer empty: the nav used to be invisible up here, so the
          bar could afford to be nothing at all, and now it is a working menu sitting on an
          arbitrary photo. That needs a ground — never as a `backdrop-filter` or a transform on
          the `<header>` itself, which would make it a backdrop root and take the menu band's blur
          with it (see above).

          Why not one layer with two class lists, which is where this started: a gradient is
          `background-image` and a flat tint is `background-color`, and `background-image` does not
          interpolate. The scrim would have vanished the instant the scroll crossed 50 px while the
          solid colour faded in behind it over 500 ms — muted ink over ~25 % ground on a hero photo
          for about a third of a second, i.e. precisely the case `navLinkClass` branches to avoid.
          Two layers cross-fade on `opacity`, which does interpolate, so the ground falls from 85 %
          to about 65 % at worst and climbs back — which is what makes the ink's own switch safe
          with no delay at all (see `headerNavInk` above).

          The geometry: the box reaches 32 px BELOW the bar (`-bottom-8`) and the gradient holds
          `background/85` for the first 60 % of those 80 px — exactly the 48 px the bar occupies —
          before fading out over the strip underneath. So the nav sits on an even ground and the
          scrim has no edge of its own: a hard line across a hero photo reads as part of the
          picture. Tint rather than blur, because the photo under the bar stays a photo; the blur
          is what the solid state adds. Hero pages only — everywhere else `isTransparent` is never
          true and this would be an always-invisible layer. */}
      {isHeroPage && (
        <div
          aria-hidden="true"
          className={`from-background/85 pointer-events-none absolute inset-x-0 top-0 -bottom-8 -z-10 bg-gradient-to-b from-60% to-transparent transition-opacity duration-500 ${
            isTransparent ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div
        /* `h-full`, not a second `h-12`: the header is `h-12 border-b` and Tailwind boxes are
           border-box, so its CONTENT box is 47 px. A hard-coded 48 px here overflowed it by a
           pixel and, worse, centred the in-flow logo on a different box than the corner copy,
           which is absolutely centred in the header itself — the two copies of the same lockup
           sat 0.5 px apart for the whole handoff. */
        /* The row's own width, and it may NOT come from the viewport. `container`
           is a media-query utility: its max-width is picked from how wide the
           WINDOW is, while its parent here is the header, whose box the trip
           planner shrinks without the window changing at all. The two disagree
           the moment the panel opens, and the container then fills its parent
           edge to edge — measured on a park page with the planner open, the
           lockup sat at x=8 in a 1552 px header and at x=0 in a 992 px one,
           flush against the screen. `md:px-0` is the other half: the padding is
           dropped because the max-width is supposed to be providing the inset,
           so when the max-width stops applying the row loses both at once.
           Same thresholds, asked of the header instead — `@container` is already
           on it for the nav switches — so the row insets against the space it
           actually has.

           And `px-4` is a FLOOR now rather than something the max-width
           replaces. `md:px-0` assumed the container is always narrower than its
           parent, which is false at every tier boundary: at a 1024 px window
           the 1024 tier applies, the row fills the header exactly, and the
           lockup sat at x=0 — flush against the edge of the screen, planner or
           no planner. Measured at 768 and 1024 shut, and at 1440 and 2000 with
           the panel open. Above 768 the bar's contents move 16 px inward; below
           it nothing changes, which is where the width budget in
           `design-system.md` is counted. */
        className="mx-auto flex h-full w-full items-center justify-between px-4 @min-[768px]:max-w-[768px] @min-[1024px]:max-w-[1024px] @min-[1280px]:max-w-[1280px] @min-[1536px]:max-w-[1536px]"
      >
        {/* Corner logo – absolute, visible only when transparent (hero top).
            Same left-6 offset as the hero image info text below. On scroll it hands over to the
            bar logo below: see the handoff note above. `-translate-y-1/2` is Tailwind's
            standalone `translate` property, so the inline `transform` composes with it rather
            than dropping the centring. */}
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

        {/* Header logo – in flex flow, arrives from the corner on scroll. Keeps the
            justify-between anchor when invisible; the transform is layout-free, so the anchor
            holds throughout the handoff too. */}
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

        {/* Desktop Navigation.

            It used to fade in on scroll, and that is what this change undid. `isTransparent` put
            `opacity-0 pointer-events-none` on this row, `aria-hidden` on the `<nav>` and
            `tabIndex={-1}` on every link inside it, so on all six hero pages the main menu was
            unclickable and out of the accessibility tree and the tab order until the visitor had
            scrolled 50 px — with nothing on screen saying a menu was there. The bar keeps its two
            states; the navigation is no longer one of them. */}
        {/* One breakpoint for the whole bar, not two.
            The nav used to appear at `md` while the search input waits for `lg`, so between 768
            and 1023 px the row carried the full navigation AND a 256 px search button AND no
            burger — 789 px of content in a 736 px box. German wrapped it onto two lines and the
            document grew a horizontal scrollbar. The trigger is icon-only below `lg` now, and the
            nav starts where the input does; under that width everything lives in the burger,
            which is the only arrangement that holds in all six languages.

            `whitespace-nowrap` is the other half and was missing. Without it the
            flex items shrink and WRAP their labels: measured at 1024 px in all
            six languages, "Parks entdecken" and "So funktioniert's" came out on
            two lines each in a 48 px bar, and the first of them painted across
            the logo. A nav label is never two lines — the row is one line by
            construction — so the row is allowed to be tighter (`gap-3.5`, and
            `xl:gap-5` instead of 6) and the search field beside it shrinks
            before anything here does. */}
        <nav
          className="hidden items-center gap-3.5 whitespace-nowrap @min-[1024px]:flex @min-[1280px]:gap-5"
          aria-label="Main navigation"
        >
          {showNearbyPark && (
            <Link
              href={convertApiUrlToFrontendUrl(nearestPark.url)}
              prefetch={false}
              className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              aria-label={t('nearbyPark', { parkName: nearestPark.name })}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="max-w-[140px] truncate">{nearestPark.name}</span>
            </Link>
          )}
          {/* Discovery. The trigger goes to `/parks` — the actual index — where it used to go
              straight to `/parks/europe`, i.e. past the hub and into one of its five children. */}
          {geoMenu && geoMenu.length > 0 ? (
            <NavMenu href="/parks" label={t('explore')} floating={isTransparent}>
              <ParksMenuPanel continents={geoMenu} featured={featuredParks ?? []} />
            </NavMenu>
          ) : (
            <Link href="/parks" prefetch={false} className={navLinkClass}>
              {t('explore')}
            </Link>
          )}
          {/* Der Tagesplaner. Er stand hier zuerst nicht, weil diese Zeile mit
              sechs Einträgen schon umbrach; `whitespace-nowrap` und die
              schmalere Suche haben ihn möglich gemacht und **nicht** gereicht —
              auf Französisch lief die Zeile bei 1024 px 23,7 px über ihre Box,
              siehe den Kommentar am „Mehr"-Eintrag unten. */}
          <Link href={plannerPath} prefetch={false} className={navLinkClass}>
            {t('planner')}
          </Link>
          {/* Backstage — der Blog, und er ist der eine der vier Reiselektüre-Einträge, der aus
              dem „Mehr"-Panel wieder in die Zeile zurückkommt. Er ist der stärkste SEO-Treiber
              der Seite, und hinter einem Sammel-Trigger sieht ihn nur, wer ihn aufklappt.

              Ein eigener `NavMenu` und nicht bloß ein Link: das Panel, das `BlogMenuPanel`
              zeichnet, steht damit wieder unmittelbar unter seinem eigenen Eintrag statt in der
              rechten Hälfte eines fremden. Mit `href="/blog"`, also ein echtes `<a>` plus
              Chevron-Button — siehe NavMenu, Regel 2. Ohne Panel-Daten bleibt der nackte Link
              übrig, dieselbe Staffelung wie beim Parks-Eintrag oben.

              Der Platz dafür war da: die Zeile hatte vor diesem Eintrag 346,8 px Luft auf
              Französisch bei 1024 px Container (gemessen auf `/parks/europe/germany`), und die
              23,7 px Überlauf, die PAR-191 aufgelöst hat, kamen von SECHS Einträgen. */}
          {showBlog &&
            (blogMenu && blogMenu.recent.length > 0 ? (
              <NavMenu href="/blog" label={t('blog')} floating={isTransparent}>
                <BlogMenuPanel {...blogMenu} />
              </NavMenu>
            ) : (
              <Link href="/blog" prefetch={false} className={navLinkClass}>
                {t('blog')}
              </Link>
            ))}
          {/* Der Sammel-Eintrag, und er ist der Grund, warum die drei Links darüber hier nicht
              mehr stehen: „Beste Reisezeit", „Wörterbuch" und „So funktioniert's" waren eigene
              Einträge in einer Zeile, die auf Französisch bei 1024 px 23,7 px über ihre Box lief
              und das Dokument auf 1032 px zog. Sie liegen jetzt im Panel, das `MoreMenuPanel`
              beschreibt — im HTML jeder Seite, weil `MenuBand` das Panel nur versteckt und nie
              abhängt.

              Als letzter der vier Navigationseinträge, weil ein Sammel-Trigger ans Ende einer
              Zeile gehört; die Favoriten dahinter sind wie „Mehr" kein Link. Vor allen vieren
              kann noch der Nearby-Chip stehen, der ist aber ein Fund und kein Menüpunkt.

              Ohne `href`: „Mehr" hat keine eigene Seite. Siehe NavMenu, Regel 2. */}
          <NavMenu label={t('more')} floating={isTransparent}>
            <MoreMenuPanel
              bestTimeHref={bestTimePath}
              glossaryHref={glossaryPath}
              howtoHref={howtoPath}
              glossary={glossaryMenu}
            />
          </NavMenu>
          {/* Favoriten stehen in dieser Zeile und nicht im Aktionsbereich rechts: sie öffnen
              dasselbe Band wie „Parks entdecken" und „Mehr", mit derselben Hover-Hysterese, und
              eine Zeile, in der ein Eintrag anders aufgeht als seine Nachbarn, muss man zweimal
              lernen. Einer von zwei Einträgen ohne Link, aus einem anderen Grund als „Mehr":
              „Mehr" ist eine Sammlung ohne eigene Seite, die Favoriten haben eine, die jedem
              Leser etwas anderes antwortet — siehe FavoritesMenu. */}
          <FavoritesMenu floating={isTransparent} />
        </nav>

        {/* Search Desktop */}
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

        {/* Actions. `max-sm:gap-1` is width, not taste: at 320 px — the smallest viewport still in
            the logs — this row is over its box by 26 px with the °C/°F button in it, and 16 px of
            that is absorbed by the container's own padding before the document starts scrolling
            sideways. Halving the two gaps between the three groups gives back 8 px and puts the
            bar where it stood before the button existed (18 px over, invisible). Below `sm`
            nothing else in here can give: every control is already at its documented exception. */}
        <div className="flex items-center gap-2 max-sm:gap-1">
          {/* The icon trigger, up to `xl` and not just up to `lg`. The nav row
              is one line by construction now, so it cannot give width back —
              and at 1024 px it took the document 28 px wide in German and 103
              in French with a 176 px input beside it. A 36 px icon that opens
              the same palette costs nobody a search; a horizontal scrollbar on
              every page costs everybody. */}
          <div className="@min-[1280px]:hidden">
            <SearchCommand trigger="button" size="sm" />
          </div>

          {/* Locale + theme + unit. The only copy IN THE BAR — see the handoff note above for the
              corner pill that used to hold a second one while the bar floated.

              Not on a phone (PAR-434): below a 640 px bar the three move into the burger sheet,
              where they are one row at the end of the list. They were three controls of 24–34 px
              in a row with 25 px of slack at 360, and they are preferences a visitor sets once,
              not navigation. The bar's width and not the window's, like every switch in here.
              The sheet copy is unconditional, because the sheet exists only below 1024 and a
              portal cannot ask this container anything — between 640 and 1023 the three are in
              both places, which costs nothing, while a mismatch could leave them in neither. */}
          <div className="flex items-center gap-1 @max-[640px]:hidden">
            <LocaleSwitcher />
            <ThemeToggle />
            {/* The unit lived in the weather card's header, i.e. on park pages only, while it
                governs temperatures in the calendar, in blog posts and on the best-travel-time
                hub as well. Third preference in the same cluster — and the one that made the row
                measurable: see TemperatureUnitToggle and LocaleSwitcher for the 25 px of slack
                this bar has at 360 px and where the space for it came from. */}
            <TemperatureUnitToggle />
          </div>

          {/* The planner's way in on a phone, where the edge tab is not drawn — see
              PlannerHeaderButton for why it asks `planner-phone` rather than this bar. */}
          <PlannerHeaderButton label={t('planner')} />

          {/* Mobile Menu */}
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
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              {/* The scroll belongs to the nav, not to the sheet. `SheetContent` is the
                  positioned ancestor of the X in components/ui/sheet.tsx, so with
                  `overflow-y-auto` on it the close button scrolled up and out of the panel with
                  the links — on the one surface that IS the phone navigation. `overscroll-contain`
                  stops a flick at the end of the list from carrying on into the page behind. */}
              <SheetContent side="right" className="w-[300px] p-6 pt-12">
                <nav
                  ref={sheetRef}
                  // `min-h-0` is load-bearing, not tidying: `flex-1` leaves `min-height: auto`,
                  // and a flex item with that will not shrink below its content — so the nav grew
                  // past the sheet instead of scrolling inside it, and a menu longer than the
                  // panel spilled out with no way to reach the end. With `min-h-0` it is the
                  // scroll container the close button no longer sits in.
                  className="mt-8 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain"
                  aria-label="Mobile navigation"
                >
                  {showNearbyPark && (
                    <Link
                      href={convertApiUrlToFrontendUrl(nearestPark.url)}
                      prefetch={false}
                      className="bg-muted/80 hover:bg-muted text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                      aria-label={t('nearbyPark', { parkName: nearestPark.name })}
                      data-sheet-stagger
                    >
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {t('nearbyPark', { parkName: nearestPark.name })}
                    </Link>
                  )}
                  {/* Favorites, first — on a phone this sheet IS the navigation, and a returning
                      visitor's own parks are the shortest route out of it. Radix unmounts the
                      sheet's contents when it closes, so `open` is only ever true here and the
                      panel's request is gated by the sheet itself. */}
                  <div data-sheet-stagger className="border-border/60 border-b pb-4">
                    <FavoritesMenuPanel open variant="sheet" />
                  </div>
                  {showBlog && (
                    <Link
                      href="/blog"
                      prefetch={false}
                      data-sheet-stagger
                      className="hover:text-primary text-lg font-medium transition-colors"
                    >
                      {t('blog')}
                    </Link>
                  )}
                  <Link
                    href="/"
                    prefetch={false}
                    data-sheet-stagger
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('home')}
                  </Link>
                  {/* Discovery in the sheet: a native <details>, so the continents open with no
                      JavaScript at all and the disclosure state is the browser's, not ours. The
                      countries stay out of it — the sheet is a phone-sized column, and the
                      continent hubs are one tap from the parks that matter. */}
                  <details className="group" data-sheet-stagger>
                    <summary className="hover:text-primary flex cursor-pointer list-none items-center justify-between text-lg font-medium transition-colors">
                      {t('explore')}
                      <ChevronDown
                        className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="border-border/60 mt-2 ml-1 flex flex-col gap-2 border-l pl-3">
                      <Link
                        href="/parks"
                        prefetch={false}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {t('parks')}
                      </Link>
                      {(geoMenu ?? []).map((continent) => (
                        <Link
                          key={continent.slug}
                          href={`/parks/${continent.slug}`}
                          prefetch={false}
                          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                        >
                          {translateContinent(tGeo, continent.slug, locale, continent.name)}
                        </Link>
                      ))}
                    </div>
                  </details>
                  <Link
                    href={bestTimePath}
                    prefetch={false}
                    data-sheet-stagger
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('bestTime')}
                  </Link>
                  <Link
                    href={glossaryPath}
                    prefetch={false}
                    data-sheet-stagger
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('glossary')}
                  </Link>
                  <Link
                    href={howtoPath}
                    prefetch={false}
                    data-sheet-stagger
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('howto')}
                  </Link>
                  <Link
                    href={plannerPath}
                    prefetch={false}
                    data-sheet-stagger
                    className="hover:text-primary text-lg font-medium transition-colors"
                  >
                    {t('planner')}
                  </Link>
                  {/* Dieselbe Zeile wie im Fuß des „Mehr"-Panels, aus einer Definition, und aus
                      demselben Grund hier unten und kleiner: der Rest dieser Liste sind Ziele, die
                      Besucher suchen, diese sind Ziele, die man findet. Hier stehen drei davon und
                      im Panel vier — „Meine Favoriten" trägt in diesem Sheet schon das
                      Favoriten-Panel darüber, siehe `MoreMenuLinks` samt Begründung, warum das
                      Sheet die Zeile überhaupt bekommt. */}
                  <MoreMenuLinks variant="sheet" />
                  {/* The three preferences the bar no longer carries on a phone. Last, because
                      they are set once and then left alone; the same components as the bar's,
                      so a change to one is a change to both. */}
                  <div
                    data-sheet-stagger
                    className="border-border/60 flex items-center justify-between gap-3 border-t pt-4"
                  >
                    <span className="text-muted-foreground text-sm">{t('preferences')}</span>
                    <div className="flex items-center gap-1">
                      <LocaleSwitcher />
                      <ThemeToggle />
                      <TemperatureUnitToggle />
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
