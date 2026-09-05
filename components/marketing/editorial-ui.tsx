import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FaqAccordion } from '@/components/faq/faq-accordion';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { FaqStructuredData } from '@/components/seo/structured-data';
import type { CrowdLevel } from '@/lib/api/types';
import { ShieldCheck, type LucideIcon } from 'lucide-react';
import { Reveal, ScrollCue } from './scroll-reveal';
import { ChapterHeading } from '@/components/common/chapter-heading';

// Shared editorial/marketing UI kit — a full-bleed hero, Almanac-style numbered
// section shells, scroll-revealed figures and cards. Used by the Fancast model
// page and the "best time to visit" hub so both read as one design system.

// ── Full-bleed hero ──────────────────────────────────────────────────────────

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

export function Hero({
  kicker,
  title,
  tagline,
  imageSrc,
  imageAlt,
  stats,
  scrollLabel,
  titleClassName = 'text-6xl font-black tracking-tight sm:text-8xl',
  flowInto = false,
}: {
  kicker: string;
  title: string;
  tagline: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  scrollLabel: string;
  /** Override the h1 size — long titles (the hub) want a smaller scale than "Fancast". */
  titleClassName?: string;
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
}) {
  return (
    <header
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
      />
      {/* Title/tagline sit directly on the photo (no panel). Readability comes from
          a theme-aware tint that fades into the page background — a dark tint in
          dark mode, a light tint in light mode — so the image never gets a dark
          overlay in light mode and never fades dark→white. */}
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
        <Reveal>
          <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
            <span className="bg-primary inline-block h-2 w-2 rounded-full" />
            {kicker}
          </p>
          <h1 className={cn('text-foreground', titleClassName)}>{title}</h1>
          <p className="text-foreground/80 mt-5 max-w-2xl text-lg leading-relaxed sm:text-2xl">
            {tagline}
          </p>
        </Reveal>

        {stats.length > 0 && (
          <Reveal delay={150}>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
              {stats.map((s) => (
                <div key={s.label} className="min-w-[6rem]">
                  <dt className="text-foreground text-3xl font-bold tabular-nums sm:text-4xl">
                    {s.value}
                  </dt>
                  <dd className="text-muted-foreground text-xs tracking-wide uppercase">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
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

// ── Numbered section shell (Almanac-style "01 / 02 / …") ─────────────────────
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
export function IngredientGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 @min-[1024px]/page:grid-cols-3">{children}</div>;
}

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
    <Reveal delay={delay}>
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
const CROWD_SPECTRUM = 'linear-gradient(90deg,#0d9488,#10b981,#22c55e,#f97316,#f43f5e,#dc2626)';

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

// ── Standalone captioned figure ──────────────────────────────────────────────
export function Figure({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <Reveal>
      <figure className="space-y-2">
        <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden rounded-2xl border shadow-md">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            priority={priority}
          />
        </div>
        {caption && (
          <figcaption className="text-muted-foreground text-center text-sm italic">
            {caption}
          </figcaption>
        )}
      </figure>
    </Reveal>
  );
}

// ── Icon touchpoint cards ────────────────────────────────────────────────────
export function TouchpointGrid({
  items,
}: {
  items: Array<{ icon: React.ElementType; title: string; body: React.ReactNode }>;
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
      <FaqAccordion
        items={items.map((item) => ({ question: item.question, answer: item.answer }))}
        padding="flush"
      />
    </>
  );
}

// Re-export so consumers can reference the crowd type if needed.
export type { CrowdLevel };
