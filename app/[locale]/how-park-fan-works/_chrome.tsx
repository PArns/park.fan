import React from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/marketing/scroll-reveal';

/**
 * Page chrome specific to the guide: the wait-time display its hero carries as
 * the `aside` of the shared `LandingHero`, the ambience behind a chapter, and the
 * park-page anatomy rail. The hero and the closing next step are the shared ones
 * in `components/marketing/editorial-ui.tsx`.
 */

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
      {/* The glow, out of flow and behind. Kept tight to the panel: on a wide box a
          wider one reads as an amber smear rather than a lit panel. */}
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

/**
 * A chapter's opening paragraph with one fact parked beside it, in the band the capped text
 * leaves empty under the section head's full-width rule. One number, not a dashboard.
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
    // `overflow-x-clip`, not `overflow-hidden`: the glow hangs off both sides of a phone, and
    // `hidden` would make this a scroll container, which the sticky figure inside would then
    // stick to. `clip` cuts the overflow without creating one.
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

/** One block of the park page in `ParkAnatomy`'s walk-through. */
export interface AnatomyStep {
  title: string;
  body: string;
  /**
   * What the block actually says on one real park, so the description has
   * something to land on. Every value here is one the API returned for
   * Phantasialand.
   */
  example?: string;
  /**
   * The production component, for the blocks a reader has not met in an earlier
   * chapter and cannot picture from a sentence, such as the weather ones.
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
