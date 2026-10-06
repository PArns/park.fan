import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { objectPositionForSrc } from '@/lib/media/focus';
import { FaqAccordion } from '@/components/faq/faq-accordion';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { FaqStructuredData } from '@/components/seo/structured-data';
import type { CrowdLevel } from '@/lib/api/types';
import { CROWD_LEVEL_ORDER } from '@/lib/utils/crowd-level-styles';
import { ArrowRight, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Reveal, ScrollCue } from './scroll-reveal';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassCard } from '@/components/common/glass-card';
import { buttonLinkProps } from '@/components/ui/button';
import { ParkPlannerLink } from '@/components/parks/park-planner-link';

// Shared editorial/marketing UI kit — the landing-page head, Almanac-style numbered
// section shells, scroll-revealed figures and cards, and the closing next step.
// Used by every hub page so they read as one design system
// (docs/product/landing-pages.md).

// ── Landing-page head ────────────────────────────────────────────────────────

/**
 * What the section after a `flowInto` hero must carry, so it overlaps the lower
 * part of the photo on a phone and sits normally from `sm` up.
 *
 * It pairs with the hero's own mobile bottom padding (`pb-48`, 192px) and the two
 * numbers are an invariant, not a coincidence: **the padding must exceed the pull.**
 * That is what makes the overlap safe in every language at every width without
 * anyone measuring a headline. The hero is `max(78vh, its content + padding)` tall
 * and the pull is measured from its bottom edge, so a long headline grows the hero
 * and carries the pulled-up section down with it — 192 − 176 = 16px of clearance,
 * always. Tuned by hand it was not: at 360px the German tagline ran 10px _past_ the
 * first card while French had 117px to spare.
 */
export const HERO_FLOW_INTO_PULL = '-mt-44 sm:mt-0';

/** The one primary action a landing page names in its head (docs/product/landing-pages.md §4). */
export interface LandingAction {
  href: string;
  label: string;
  icon?: LucideIcon;
  prefetch?: boolean;
}

interface LandingHeroShared {
  kicker: string;
  title: string;
  tagline?: React.ReactNode;
  /** Override the h1 classes. The default is the size of the kind (concept §3); no caller needs it today. */
  titleClassName?: string;
  /**
   * A second column from `lg` up, hidden below it — the guide's `WaitSign`. Below `lg` it would
   * push the headline off the first screen, and the page shows the object again further down.
   */
  aside?: React.ReactNode;
  /** Exactly one primary button, under the tagline. A link styled by `buttonLinkProps`. */
  action?: LandingAction;
}

type LandingHeroProps =
  | (LandingHeroShared & {
      /** Hub: the full-bleed photo head. */
      variant?: 'hub';
      imageSrc: string;
      imageAlt: string;
      stats?: Array<{ value: string; label: string }>;
      scrollLabel: string;
      /**
       * Let the page's own content flow into the hero below `sm`.
       *
       * `min-h-[78vh]` + `items-end` is 658px on a phone with the headline pinned to
       * the bottom of it, so a listing page spends its whole first screen on one
       * picture and a title. With this set the headline moves to the TOP on a phone
       * and the page pulls its first section up over the lower half of the photo —
       * the image keeps every pixel of its height, the empty part of it just stops
       * being empty. The caller owns the pull (a negative margin) because only it
       * knows what comes next; the hero's part is the alignment, the tint and the
       * scroll cue.
       */
      flowInto?: boolean;
    })
  | (LandingHeroShared & {
      /**
       * Tool page: no photo, no scroll cue, no minimum height. The same kicker, type system and
       * left edge as the hub head, one size down.
       */
      variant: 'compact';
      imageSrc?: never;
      imageAlt?: never;
      stats?: never;
      scrollLabel?: never;
      flowInto?: never;
    });

/** H1 per kind, concept §3: hub 36 / 60 px, park audience and tool pages 30 / 36 px. */
const TITLE_CLASS = {
  hub: 'max-w-4xl text-4xl font-black tracking-tight sm:text-6xl',
  compact: 'max-w-4xl text-3xl font-black tracking-tight sm:text-4xl',
} as const;

/**
 * The head of every hub and tool page — `LandingHero` in docs/product/landing-pages.md.
 *
 * One implementation for both kinds, so the kicker, the type and the left edge cannot drift
 * between them: the hub draws it over a full-bleed photo, `variant="compact"` draws the same
 * block on the page background. The guide's own `GuideHero` was folded into this one; its
 * `WaitSign` is the `aside`.
 *
 * Geometry under the 48 px header: the hub runs UNDER it (`-mt-12`, one of the four places that
 * height is written down, see docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md)
 * and clears it with `pt-32`. The compact head has no picture to slide under the bar, so it stays
 * in flow below the sticky header and carries no `-mt-12`: its kicker starts 32 px (48 from `sm`)
 * below the bar's bottom edge, the same `pt-8 sm:pt-12` the trip planner's photo-less head used.
 */
export function LandingHero(props: LandingHeroProps) {
  const { kicker, title, tagline, titleClassName, aside, action } = props;
  const variant = props.variant ?? 'hub';
  const compact = variant === 'compact';

  const text = (
    <>
      <Reveal>
        <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
          <span className="bg-primary inline-block h-2 w-2 rounded-full" />
          {kicker}
        </p>
        <h1 className={cn('text-foreground', titleClassName ?? TITLE_CLASS[variant])}>{title}</h1>
        {tagline && (
          <p
            className={cn(
              'text-foreground/80 max-w-2xl leading-relaxed',
              compact ? 'mt-3 text-base sm:text-lg' : 'mt-5 text-lg sm:text-2xl'
            )}
          >
            {tagline}
          </p>
        )}
        {action && (
          <div className={compact ? 'mt-5' : 'mt-8'}>
            <Link
              href={action.href}
              prefetch={action.prefetch}
              data-landing-action=""
              {...buttonLinkProps({ size: 'lg', withIcon: !!action.icon })}
            >
              {action.icon && <action.icon aria-hidden />}
              {action.label}
            </Link>
          </div>
        )}
      </Reveal>

      {!compact && props.stats && props.stats.length > 0 && (
        <Reveal delay={150}>
          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
            {props.stats.map((s) => (
              <div key={s.label} className="min-w-[6rem]">
                <dt className="text-foreground text-3xl font-bold tabular-nums sm:text-4xl">
                  {s.value}
                </dt>
                <dd className="text-muted-foreground text-xs tracking-wide uppercase">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      )}
    </>
  );

  // The aside is a second column from `lg`, and nothing below it.
  const body = aside ? (
    <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div>{text}</div>
      <Reveal delay={100} className="hidden lg:block">
        {aside}
      </Reveal>
    </div>
  ) : (
    text
  );

  if (props.variant === 'compact') {
    return (
      <header data-landing-hero="compact" className="container mx-auto px-4 pt-8 sm:pt-12">
        {body}
      </header>
    );
  }

  const { imageSrc, imageAlt, scrollLabel, flowInto = false } = props;
  return (
    <header
      data-landing-hero="hub"
      className={cn(
        'relative isolate -mt-12 flex min-h-[78vh] overflow-hidden',
        flowInto ? 'items-start sm:items-end' : 'items-end'
      )}
    >
      {/* `sizes="100vw"` is right and stays — this photo really does span the viewport, so a
          DPR-3 phone asking for w=1200 is asking for what it will draw. The lever is the
          QUALITY. It is the LCP element on all five full-bleed heroes, it carries two gradient
          tints and a headline over it, and nothing in it is read for detail. Measured on the
          Europa-Park background (the source is ~1200 px wide, so every larger width returns the
          same file): q75 is 45,921 B and q60 is 30,607 B at w=1200, 33,345 → 22,406 at w=828.
          15 KB off the largest paint a phone waits for, for a difference nobody can see through
          the tint. `60` is in `images.qualities` (next.config.ts) — a value that is not would be
          rejected at request time. */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        quality={60}
        sizes="100vw"
        className="object-cover motion-safe:scale-105"
        style={{ objectPosition: objectPositionForSrc(imageSrc, '50% 50%') }}
      />
      {/* Title/tagline sit directly on the photo (no panel). Readability comes from
          a theme-aware tint that fades into the page background — a dark tint in
          dark mode, a light tint in light mode — so the image never gets a dark
          overlay in light mode and never fades dark→white.

          One set of stops for every hub. The guide carried stronger ones of its own
          (`via-background/80`, `to-background/25`, `from-background/70`) for its stats
          row; every hub has that row, so the guide takes the shared values. */}
      <div
        aria-hidden
        className="from-background via-background/70 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t"
      />
      <div
        aria-hidden
        className="from-background/40 pointer-events-none absolute inset-0 bg-gradient-to-r to-transparent"
      />
      {/* The tint above fades UP from the bottom, because the headline used to sit
          there. Moved to the top on a phone it would sit on the one part of the
          photo that is barely tinted at all (`to-background/20`), so `flowInto`
          adds the mirror image of that fade — phones only, and only over the top
          third, so the middle of the picture stays a picture. */}
      {flowInto && (
        <div
          aria-hidden
          className="from-background pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b to-transparent sm:hidden"
        />
      )}

      <div
        className={cn(
          'text-foreground relative container mx-auto px-4 pt-32 sm:pb-24',
          // 192px, and it has to stay larger than HERO_FLOW_INTO_PULL — see there.
          flowInto ? 'pb-48' : 'pb-16'
        )}
      >
        {body}
      </div>

      {/* The cue points at content that is already on screen once it flows in. */}
      {flowInto ? (
        <div className="hidden sm:block">
          <ScrollCue label={scrollLabel} />
        </div>
      ) : (
        <ScrollCue label={scrollLabel} />
      )}
    </header>
  );
}

// ── Next step ────────────────────────────────────────────────────────────────

/** One place a landing page sends its reader on to. */
export interface LandingDestination {
  href: string;
  label: string;
  /** One line under the button: what the destination answers. */
  description?: string;
  icon?: LucideIcon;
  prefetch?: boolean;
  /**
   * The press opens the trip planner's panel on the park the route is about instead of following
   * `href` (which stays the planner's page, for a modified click and a crawler): the park header's
   * `ParkPlannerLink`, drawn as this row's button, with its icon. Set `href` to
   * `plannerPath(locale)`. The page needs a `PlannerPageParkBeacon` for the wizard to know the park.
   */
  parkPlanner?: { locale: string };
}

/**
 * The closing "next step" of a landing page — `LandingNextSteps` in
 * docs/product/landing-pages.md §2.
 *
 * One to three destinations; the first is the page's primary action and the only primary
 * button, the rest are outline buttons. It replaced four components that each drew this
 * differently: the guide's `ClosingBand`, the best-time hub's `FancastCta` card and the two
 * `NextStep` copies on the park audience pages.
 *
 * `surface` is where it stands, not what it is. `band` is the full-width tinted band of the hub
 * pages. `chapter` is a park audience page, which sits on the park's photo backdrop and opens
 * every chapter with a frosted `ChapterHeading` over a `GlassCard` tile, so the next step opens
 * the same way as the chapters above it.
 */
export function LandingNextSteps({
  kicker,
  title,
  body,
  destinations,
  surface = 'band',
  headingId,
}: {
  kicker?: string;
  title: string;
  body?: string;
  destinations:
    | [LandingDestination]
    | [LandingDestination, LandingDestination]
    | [LandingDestination, LandingDestination, LandingDestination];
  surface?: 'band' | 'chapter';
  /** `id` of the heading, for the section's `aria-labelledby`. Give it with `surface="chapter"`. */
  headingId?: string;
}) {
  const described = destinations.some((d) => d.description);

  const links = destinations.map((d, i) => {
    const look = buttonLinkProps({
      variant: i === 0 ? 'default' : 'outline',
      size: 'lg',
      withIcon: !!d.icon || !!d.parkPlanner,
      // A label runs to 36 characters in Dutch; on a phone it wraps inside the button
      // rather than pushing the button past the container.
      className: 'h-auto min-h-10 max-w-full py-2 whitespace-normal max-sm:min-h-11',
    });
    if (d.parkPlanner) {
      return (
        <ParkPlannerLink key={d.href} label={d.label} locale={d.parkPlanner.locale} button={look} />
      );
    }
    return (
      <Link key={d.href} href={d.href} prefetch={d.prefetch} {...look}>
        {d.icon && <d.icon aria-hidden />}
        {d.label}
      </Link>
    );
  });

  const list = described ? (
    <ul className={cn('grid gap-5 sm:grid-cols-2', destinations.length === 3 && 'lg:grid-cols-3')}>
      {destinations.map((d, i) => (
        <li key={d.href} className="flex flex-col items-start gap-2">
          {links[i]}
          {d.description && (
            <p className="text-muted-foreground text-sm leading-relaxed">{d.description}</p>
          )}
        </li>
      ))}
    </ul>
  ) : (
    <div className="flex flex-wrap gap-3">{links}</div>
  );

  if (surface === 'chapter') {
    return (
      <section data-landing-next="" className="mt-8" aria-labelledby={headingId}>
        <ChapterHeading icon={ArrowRight} kicker={kicker} title={title} id={headingId} frosted />
        <GlassCard variant="tile">
          {body && <p className="text-muted-foreground mb-5 leading-relaxed">{body}</p>}
          {list}
        </GlassCard>
      </section>
    );
  }

  return (
    <section data-landing-next="" className="relative isolate overflow-hidden border-y">
      <div
        aria-hidden
        className="from-primary/12 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br via-transparent to-amber-500/10"
      />
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <Reveal>
          {kicker && (
            <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
              {kicker}
            </p>
          )}
          <h2 className="text-2xl font-bold text-balance sm:text-4xl">{title}</h2>
          {body && <p className="text-muted-foreground mt-4 leading-relaxed">{body}</p>}
          <div className="mt-8">{list}</div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Numbered section shell (Almanac-style "01 / 02 / …") ─────────────────────
/**
 * Numbered chapter of an editorial page: a section with a scroll anchor, a large `ChapterHeading`
 * (index, icon, kicker, title) and the content below it.
 */
export function SectionShell({
  id,
  index,
  kicker,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  index: string;
  kicker?: string;
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="container mx-auto px-4">
        <Reveal>
          <ChapterHeading
            index={index}
            icon={Icon}
            kicker={kicker}
            title={title}
            size="lg"
            className="mb-8 pb-5"
          />
        </Reveal>
        <div className="space-y-5">{children}</div>
      </div>
    </section>
  );
}

// ── Text primitives ──────────────────────────────────────────────────────────
// Running text runs the full width of its section — the same edges as the
// headings, rules, figures and card grids around it. A narrower measure left a
// ragged column with a dead strip beside every paragraph.
export function Lead({ children }: { children: React.ReactNode }) {
  return <p className="text-foreground/80 text-xl leading-relaxed font-medium">{children}</p>;
}

/** Body paragraph of an editorial page, in the muted text colour. */
export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground leading-relaxed">{children}</p>;
}

/** Glossary-aware paragraph — auto-links known terms (string children only). */
export function PG({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground leading-relaxed">
      <GlossaryInject>{children}</GlossaryInject>
    </p>
  );
}

/**
 * An inline link inside editorial prose.
 *
 * The site sets no global `a` style, so a bare `<Link>` in a `<P>` inherits the
 * muted body colour and is invisible as a link — which is what every inline
 * cross-reference on these pages looked like. Kept here rather than repeated
 * per content file so the six translations of a page cannot drift apart on it.
 */
export function A({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        'text-primary decoration-primary/40 font-medium underline underline-offset-2',
        'hover:decoration-primary transition-colors',
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Tinted callout box with a shield icon, setting one statement apart from the running text. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <Reveal>
      <div className="from-primary/10 border-primary/20 flex gap-3 rounded-2xl border bg-gradient-to-br to-transparent p-5 text-base leading-relaxed sm:p-6">
        <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-foreground/90">{children}</p>
      </div>
    </Reveal>
  );
}

// ── Ingredient / feature cards ───────────────────────────────────────────────
/** Responsive grid (one, two, then three columns by page width) for `IngredientCard`s. */
export function IngredientGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">{children}</div>;
}

/**
 * Feature card on an editorial page: an icon tile, a title and a short text, revealed on scroll
 * with an optional delay.
 */
export function IngredientCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal containsGlass delay={delay}>
      <Card className="hover:border-primary/40 h-full py-0 transition-colors">
        <CardContent className="flex h-full flex-col gap-2 p-5">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <h3 className="mt-1 font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>
        </CardContent>
      </Card>
    </Reveal>
  );
}

// ── Crowd-level spectrum: gradient bar + coloured cards ───────────────────────
// The site's crowd palette (`--crowd-*`) in scale order, so it follows the theme and any retuning
// of the tokens. It was six fixed hex values from an older palette.
const CROWD_SPECTRUM = `linear-gradient(90deg,${CROWD_LEVEL_ORDER.map(
  (level) => `var(--crowd-${level.replace('_', '-')})`
).join(',')})`;

/**
 * The crowd-level scale as a gradient bar in the site's crowd colours, followed by one card per
 * level with its `CrowdLevelBadge` and an explanation.
 */
export function CrowdSpectrum({
  items,
}: {
  items: Array<{ level: CrowdLevel | 'closed'; text: string }>;
}) {
  return (
    <div className="space-y-5">
      <Reveal>
        <div
          className="h-3 w-full rounded-full"
          style={{ background: CROWD_SPECTRUM }}
          aria-hidden
        />
      </Reveal>
      <div className="grid gap-3 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.level} delay={i * 60}>
            <div className="bg-card h-full rounded-xl border p-4">
              <CrowdLevelBadge level={item.level} />
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

// ── Alternating image/text row for editorial examples ────────────────────────
/**
 * Image beside text on an editorial page: a 4:3 photo and a kicker, title, paragraph and optional
 * badge, side by side from 768 px of page width; `reverse` puts the photo on the right.
 */
export function SplitFigure({
  src,
  alt,
  kicker,
  title,
  children,
  reverse = false,
  badge,
}: {
  src: string;
  alt: string;
  kicker?: string;
  title: string;
  children: React.ReactNode;
  reverse?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Reveal>
      {/* All three of these are one decision and have to switch together: the second
          column, the gutter that only exists once there is one, and the swap that puts
          the picture on the right. They ask `@container/page` (app/[locale]/layout.tsx)
          because what decides whether a picture and a paragraph fit side by side is the
          room this row has, and with the trip planner open the window is no longer that
          — a 2000 px window with a 900 px panel laid a 1100 px page out for 2000.

          The image `sizes` below cannot follow: a `sizes` condition has no container
          form. So with the panel open it can now under-serve — page 600 draws one
          full-width picture while the hint, reading a 1400 px window, still asks for the
          two-column 500 px — which is a slightly soft image, not a broken row. Left as
          it is because the same hint already under-serves without any panel (at 1536 px
          the column is ~750 px), so that is a pre-existing number to correct on its own
          terms rather than under this change. */}
      <div className="grid items-center gap-6 @min-[768px]/page:grid-cols-2 @min-[768px]/page:gap-10">
        <div
          className={cn(
            'relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-lg',
            reverse && '@min-[768px]/page:order-2'
          )}
        >
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover"
            style={{ objectPosition: objectPositionForSrc(src, '50% 50%') }}
          />
        </div>
        <div className="space-y-3">
          {kicker && (
            <div className="text-primary flex items-center gap-2 text-xs font-semibold tracking-widest uppercase">
              {kicker}
            </div>
          )}
          <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{children}</p>
          {badge && <div className="pt-1">{badge}</div>}
        </div>
      </div>
    </Reveal>
  );
}

// ── Icon touchpoint cards ────────────────────────────────────────────────────
/**
 * `title` is a node, not a string, so a card can carry a glossary link on the term it is named
 * after — the same thing {@link SectionHeading} does on the park pages. `body` was already one.
 */
export function TouchpointGrid({
  items,
}: {
  items: Array<{ icon: React.ElementType; title: React.ReactNode; body: React.ReactNode }>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item, i) => (
        <Reveal key={i} delay={i * 60}>
          <div className="bg-card flex h-full gap-3 rounded-xl border p-4">
            <div className="bg-primary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              <item.icon className="text-primary h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">{item.body}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ── FAQ: accordion + FAQPage structured data ─────────────────────────────────
/**
 * The editorial pages' FAQ — the same rows as the park and ride pages, plus its own `FAQPage`.
 *
 * The list itself is {@link FaqAccordion}, which every FAQ on the site draws. It used to be a
 * third treatment: a chevron rotating 90° the other way, no hover, no rule under the question and
 * its own padding, so the same object looked different depending on which page a reader had
 * arrived from. No icons here, because these arrays carry none and an invented one per question
 * would be decoration with nothing behind it.
 *
 * The structured data stays where it is, emitted from the same array it renders, so the markup
 * cannot drift from the page. The rows are not wrapped in a `ChapterPanel`: these sit inside
 * `SectionShell` on a page with no photo backdrop, where the chapter's box is the section band
 * itself.
 */
export function FaqList({ items }: { items: ReadonlyArray<{ question: string; answer: string }> }) {
  return (
    <>
      <FaqStructuredData items={items} />
      {/* `data-faq-list` is what `pnpm check:landing-pages` looks for beside a `FAQPage`. */}
      <div data-faq-list="">
        <FaqAccordion
          items={items.map((item) => ({ question: item.question, answer: item.answer }))}
          padding="flush"
        />
      </div>
    </>
  );
}

// Re-export so consumers can reference the crowd type if needed.
export type { CrowdLevel };
