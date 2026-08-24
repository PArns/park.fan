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
 * sign that means nothing on its own — so the hero shows that object and lets
 * the headline ask about it. Everything below is then an answer.
 */

// ── The sign ─────────────────────────────────────────────────────────────────

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
}: {
  value: number;
  unit: string;
  caption?: string;
  className?: string;
  /** `lg` for the hero, `md` where it sits next to a card. */
  size?: 'md' | 'lg';
}) {
  return (
    <div className={cn('relative', className)}>
      {/* The glow. Out of flow and behind, so it can never affect layout. */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-amber-500/20 blur-3xl motion-safe:animate-pulse"
      />
      <div
        className={cn(
          'relative flex flex-col items-center justify-center overflow-hidden rounded-2xl',
          'border border-amber-950/60 bg-[#0b0a08] shadow-2xl shadow-amber-950/40',
          size === 'lg' ? 'px-10 py-8 sm:px-14 sm:py-10' : 'px-8 py-6'
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
        <span
          className={cn(
            'font-mono leading-none font-bold text-amber-400 tabular-nums',
            'drop-shadow-[0_0_18px_rgba(251,191,36,0.55)]',
            size === 'lg' ? 'text-8xl sm:text-9xl' : 'text-6xl'
          )}
        >
          {value}
        </span>
        <span
          className={cn(
            'mt-3 font-mono tracking-[0.35em] text-amber-400/70 uppercase',
            size === 'lg' ? 'text-sm' : 'text-[10px]'
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
  sign,
}: {
  kicker: string;
  title: string;
  tagline: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  stats: Array<{ value: string; label: string }>;
  scrollLabel: string;
  sign: { value: number; unit: string; caption: string };
}) {
  return (
    <header className="relative isolate -mt-12 flex min-h-[86vh] items-end overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority
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

      <div className="text-foreground relative container mx-auto px-4 pt-28 pb-16 sm:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div>
            <Reveal>
              <p className="text-foreground/70 mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="bg-primary inline-block h-2 w-2 rounded-full" />
                {kicker}
              </p>
              <h1 className="text-foreground max-w-3xl text-4xl font-black tracking-tight text-balance sm:text-6xl">
                {title}
              </h1>
              <p className="text-foreground/80 mt-5 max-w-xl text-lg leading-relaxed sm:text-2xl">
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
              value={sign.value}
              unit={sign.unit}
              caption={sign.caption}
              className="ml-auto w-fit"
            />
          </Reveal>
        </div>
      </div>

      <ScrollCue label={scrollLabel} />
    </header>
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
          <h2 className="max-w-3xl text-2xl font-bold text-balance sm:text-4xl">{title}</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">{body}</p>
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}
