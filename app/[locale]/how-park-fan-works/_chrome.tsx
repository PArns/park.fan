import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Reveal, ScrollCue } from '@/components/marketing/scroll-reveal';

/**
 * Page chrome specific to the guide: the hero that states its question, the
 * ambience behind a chapter, and the closing band.
 *
 * The shared `Hero` in `components/marketing/editorial-ui.tsx` puts a title over
 * a photo, which is right for the Fancast and best-travel-time pages because
 * their subject is a mood. This page's subject is an object — a number on a
 * number that means nothing on its own — so the hero shows that object and lets
 * the headline ask about it. Everything below is then an answer.
 */

// ── The wait-time display ─────────────────────────────────────────────────────────────────

/**
 * A park's wait-time display, near enough to be recognised: amber on near-black
 * behind a dot mask, with the glow such a panel throws in daylight.
 *
 * The mask is a `radial-gradient` grid rather than an image, so it costs no
 * request and scales with the type. Both layers are `aria-hidden` and the number
 * is real text — a screen reader gets "70 Minuten", not a decorative panel.
 */
export function WaitSign({
  value,
  unit,
  caption,
  className,
  size = 'lg',
  plate,
  fill = false,
}: {
  value: number;
  unit: string;
  caption?: string;
  className?: string;
  /** `lg` for the hero, `md` where it sits next to a card. */
  size?: 'md' | 'lg';
  /** Small engraved strip above the number, e.g. the ride's name. */
  plate?: string;
  /** Stretch to the parent's height, for a column that has to match a card. */
  fill?: boolean;
}) {
  return (
    <div className={cn('relative flex flex-col', fill && 'h-full', className)}>
      {/* The glow. Out of flow and behind, so it can never affect layout. Kept
          tight to the panel — at `-inset-6` on a wide box it stopped reading as
          a lit panel and became an amber smear across the column. */}
      <div
        aria-hidden
        className="absolute -inset-2 -z-10 rounded-[1.75rem] bg-amber-500/25 blur-2xl"
      />
      <div
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl',
          'border border-amber-950/60 bg-[#0b0a08] shadow-2xl shadow-amber-950/40',
          size === 'lg' ? 'px-10 py-8 sm:px-14 sm:py-10' : 'px-8 py-10'
        )}
      >
        {/* Dot mask over the whole panel, the way an LED matrix reads up close. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(0,0,0,0.75) 1px, transparent 1.15px)',
            backgroundSize: '4px 4px',
          }}
        />
        {plate && (
          <span className="relative mb-6 rounded-full border border-amber-500/25 px-3 py-1 font-mono text-[10px] tracking-[0.3em] text-amber-500/60 uppercase">
            {plate}
          </span>
        )}
        <span
          className={cn(
            'font-mono leading-none font-bold text-amber-400 tabular-nums',
            'drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]',
            size === 'lg' ? 'text-8xl sm:text-9xl' : 'text-7xl sm:text-8xl'
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            'relative mt-3 font-mono tracking-[0.35em] text-amber-400/70 uppercase',
            size === 'lg' ? 'text-sm' : 'text-xs'
          )}
        >
          {unit}
        </span>
      </div>
      {caption && (
        <p className="text-muted-foreground mt-3 text-center text-xs leading-relaxed">{caption}</p>
      )}
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

export function GuideHero({
  kicker,
  title,
  tagline,
  imageSrc,
  imageAlt,
  stats,
  scrollLabel,
  display,
}: {
  kicker: string;
  title: string;
  tagline: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  scrollLabel: string;
  display: { value: number; unit: string; caption: string };
}) {
  return (
    <header className="relative isolate -mt-12 flex min-h-[86vh] items-start overflow-hidden sm:items-end">
      {/* `quality={60}`: the LCP element, full-bleed under a tint and a headline. See the shared
          `Hero` in components/marketing/editorial-ui.tsx for the measured numbers. */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
        quality={60}
        sizes="100vw"
        className="object-cover motion-safe:scale-105"
      />
      {/* Theme-aware tint fading into the page background, so the photo keeps its
          own colours in light mode and never fades dark→white. Same approach as
          the shared hero; the extra bottom stop makes room for the stats row. */}
      <div
        aria-hidden
        className="from-background via-background/80 to-background/25 pointer-events-none absolute inset-0 bg-gradient-to-t"
      />
      <div
        aria-hidden
        className="from-background/70 pointer-events-none absolute inset-0 bg-gradient-to-r via-transparent to-transparent"
      />
      {/* Mirror of the fade above, phones only: `flowInto` puts the headline at the
          top, where that gradient is at its weakest. Top third only, so the middle
          of the picture stays a picture. See `HERO_FLOW_INTO_PULL`. */}
      <div
        aria-hidden
        className="from-background pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b to-transparent sm:hidden"
      />

      <div className="text-foreground relative container mx-auto px-4 pt-28 pb-48 sm:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <Reveal>
              <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="bg-primary inline-block h-2 w-2 rounded-full" />
                {kicker}
              </p>
              <h1 className="text-foreground text-4xl font-black tracking-tight text-balance sm:text-6xl">
                {title}
              </h1>
              <p className="text-foreground/80 mt-5 text-lg leading-relaxed sm:text-2xl">
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

          {/* The object the page is about. Hidden below lg: at that width it would
              push the headline off the first screen, and chapter 01 shows it
              again at full size anyway. */}
          <Reveal delay={100} className="hidden lg:block">
            <WaitSign
              value={display.value}
              unit={display.unit}
              caption={display.caption}
              className="ml-auto w-fit"
            />
          </Reveal>
        </div>
      </div>

      {/* The cue points at content that is already on screen once it flows in. */}
      <div className="hidden sm:block">
        <ScrollCue label={scrollLabel} />
      </div>
    </header>
  );
}

// ── Chapter intro with an aside ──────────────────────────────────────────────

/**
 * A chapter's opening paragraph with one fact parked beside it.
 *
 * Running text is capped at a readable measure while the section head rules the
 * full width, which leaves two thirds of the band empty right under the biggest
 * horizontal line on the page — the emptiest-looking spot in the layout. This
 * puts a single number there. One, not a panel of them: the point is to fill
 * the band with something worth reading, not to build a dashboard.
 */
export function IntroWithAside({
  children,
  value,
  label,
  note,
}: {
  children: React.ReactNode;
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">{children}</div>
      <Reveal delay={80}>
        <div className="border-primary/25 bg-primary/[0.04] rounded-2xl border p-5">
          <div className="text-primary text-4xl font-black tracking-tight tabular-nums">
            {value}
          </div>
          <div className="text-foreground mt-1 text-sm font-semibold">{label}</div>
          {note && <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{note}</p>}
        </div>
      </Reveal>
    </div>
  );
}

// ── Ambience ─────────────────────────────────────────────────────────────────

/**
 * A soft tint behind a chapter, so nine sections in a row do not read as one
 * long grey column.
 *
 * Deliberately a sibling `div` at `-z-10` rather than a background on the
 * section: the demos inside include frosted cards, and a `backdrop-blur` reads
 * its backdrop from ancestors — painting the tint on the section itself would
 * put it inside the blur instead of behind it.
 */
export function Ambience({
  children,
  tone = 'primary',
  className,
}: {
  children: React.ReactNode;
  tone?: 'primary' | 'amber' | 'emerald';
  className?: string;
}) {
  const tint =
    tone === 'amber'
      ? 'bg-amber-500/[0.07]'
      : tone === 'emerald'
        ? 'bg-emerald-500/[0.07]'
        : 'bg-primary/[0.07]';
  return (
    // `overflow-x-clip`, not `overflow-hidden`: the glow is 1152 px wide and hangs
    // 381 px off each side of a phone, which gave the document a horizontal
    // scrollbar. `hidden` would fix that and break the sticky figure inside — it
    // makes the element a scroll container, and `position: sticky` sticks to the
    // nearest one. `clip` cuts the overflow without creating that container.
    <div className={cn('relative isolate overflow-x-clip', className)}>
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[42rem] w-[72rem] -translate-x-1/2',
          '-translate-y-1/2 rounded-full blur-3xl',
          tint
        )}
      />
      {children}
    </div>
  );
}

// ── Park page anatomy ────────────────────────────────────────────────────────

export interface AnatomyStep {
  title: string;
  body: string;
  /**
   * What the block actually says on one real park, so the description has
   * something to land on. Every value here is one the API returned for
   * Phantasialand — the walk-through was a list of abstractions before.
   */
  example?: string;
  /**
   * The real component, for the blocks a reader has not met in an earlier
   * chapter. The three weather ones are the abstract end of this list — "the
   * next few hours in quarter-hour steps" describes nothing you can picture —
   * so they show the production component instead, as everything else on this
   * page does.
   */
  demo?: React.ReactNode;
  /** Rendered as a muted "only when…" line. Absent = the block is always there. */
  onlyWhen?: string;
}

/**
 * The park page walked top to bottom, in the order the sections actually render.
 *
 * A numbered rail rather than a grid, because the order is the information: the
 * page answers "is it open", "will it rain", "how long is the queue" and "when
 * should I have come instead" in that sequence, and a reader who knows that
 * stops hunting.
 *
 * `onlyWhen` matters as much as the rest. Half of these blocks are conditional,
 * and a guide that lists them flat teaches somebody to look for a card that
 * their park will never render.
 */
export function ParkAnatomy({
  steps,
  onlyWhenLabel,
}: {
  steps: AnatomyStep[];
  onlyWhenLabel: string;
}) {
  return (
    <ol className="not-prose relative space-y-0">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
          {/* The rail. Drawn per row and stopped on the last one, so it ends at
              the final marker instead of trailing into the next section. */}
          {i < steps.length - 1 && (
            <span aria-hidden className="bg-border absolute top-8 bottom-0 left-[15px] w-px" />
          )}
          <span
            aria-hidden
            className="bg-primary/10 text-primary relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ring-4 ring-[var(--background)]"
          >
            {i + 1}
          </span>
          <div className="pt-0.5">
            <h3 className="font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{step.body}</p>
            {step.example && (
              <p className="border-primary/30 text-foreground/70 mt-2 border-l-2 pl-3 text-sm">
                {step.example}
              </p>
            )}
            {step.demo && <div className="not-prose mt-3 max-w-xl">{step.demo}</div>}
            {step.onlyWhen && (
              <p className="text-muted-foreground/80 mt-1.5 text-xs">
                <span className="font-medium">{onlyWhenLabel}</span> {step.onlyWhen}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Closing band ─────────────────────────────────────────────────────────────

export function ClosingBand({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-y">
      <div
        aria-hidden
        className="from-primary/12 pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br via-transparent to-amber-500/10"
      />
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <Reveal>
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.2em] uppercase">
            {kicker}
          </p>
          <h2 className="text-2xl font-bold text-balance sm:text-4xl">{title}</h2>
          <p className="text-muted-foreground mt-4 leading-relaxed">{body}</p>
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
