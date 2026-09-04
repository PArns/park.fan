'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * The figure the guide is built around: one wait time, drawn against what that
 * ride's day normally looks like.
 *
 * `WaitScaleBar` is the whole picture and is a plain, server-renderable div —
 * geometry comes in as CSS custom properties, so the bar is correct in the very
 * first HTML with no JavaScript at all. `WaitScaleStage` is the sticky desktop
 * copy: it watches which step the reader is next to and tweens the same three
 * properties from one weekday's numbers to the next.
 *
 * Three rules, the same ones `use-menu-reveal.ts` arrived at:
 *
 * - **CSS owns the picture, GSAP owns the transition between two of them.** The
 *   bar is never hidden, faded or built by script. If the chunk fails, the
 *   import is blocked or the reader prefers reduced motion, the figure simply
 *   stands on the first step's numbers and every step still states its own
 *   figures in prose beside it. Nothing here is the only copy of anything.
 * - **No ScrollTrigger.** Picking the active step is an intersection question
 *   and `IntersectionObserver` answers it in eight lines, without a second GSAP
 *   plugin, without a scroller-proxy against the sticky column, and without
 *   anything to tear down on a soft navigation. GSAP does what it is good at:
 *   interpolating between two states.
 * - **Nothing touches a backdrop.** The bar sits on the page background, not on
 *   glass, and the tween writes custom properties on one element instead of
 *   transforming an ancestor.
 *
 * The numbers count too: the labels are tweened as text so the reader watches
 * 42 become 70 rather than seeing it cut. That is the point being made.
 */

type Gsap = typeof import('gsap').gsap;

let gsapPromise: Promise<Gsap | null> | null = null;
function loadGsap(): Promise<Gsap | null> {
  // The static figure is already right; there is nothing to recover from here.
  gsapPromise ??= import('gsap').then((m) => m.gsap).catch(() => null);
  return gsapPromise;
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface WaitScaleStep {
  /** Stable key; also what the step block carries in `data-wait-step`. */
  id: string;
  /** Weekday or occasion. */
  label: string;
  /** Median of that day's peak waits. */
  typical: number;
  /** 90th percentile of the same series. */
  busy: number;
  /** How many measured days the two numbers rest on. */
  sampleDays: number;
}

interface BarLabels {
  /** e.g. "Typisch" */
  typical: string;
  /** e.g. "Voll" */
  busy: string;
  /** e.g. "Min." */
  unit: string;
  /** e.g. "Messtage" */
  days: string;
  /** e.g. "Rekord" */
  record: string;
  /** Accessible summary, `{label}` / `{typical}` / `{busy}` / `{wait}` / `{days}` interpolated. */
  summary: string;
}

function pct(value: number, max: number): string {
  return `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(2)}%`;
}

/**
 * One reading of the scale. Pure and server-renderable: the three positions are
 * CSS custom properties, which is also exactly what the stage tweens.
 */
export function WaitScaleBar({
  step,
  wait,
  max,
  record,
  labels,
  className,
  interactive = false,
}: {
  step: WaitScaleStep;
  /** The number at the entrance. Fixed across all steps — it is the thing being judged. */
  wait: number;
  max: number;
  /** The ride's all-time measured peak. A property of the ride, not of the step. */
  record?: number;
  labels: BarLabels;
  className?: string;
  /** True for the sticky copy the stage drives; adds the transition hooks. */
  interactive?: boolean;
}) {
  const summary = labels.summary
    .replace('{label}', step.label)
    .replace('{typical}', String(step.typical))
    .replace('{busy}', String(step.busy))
    .replace('{days}', String(step.sampleDays))
    .replace('{wait}', String(wait));

  return (
    <figure
      className={cn('not-prose', className)}
      style={
        {
          '--band-start': pct(step.typical, max),
          '--band-end': pct(step.busy, max),
          '--needle': pct(wait, max),
        } as React.CSSProperties
      }
      data-wait-scale={interactive ? 'stage' : 'static'}
    >
      <figcaption className="sr-only" data-scale-summary>
        {summary}
      </figcaption>

      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span
          className="text-muted-foreground text-xs font-semibold tracking-widest uppercase"
          data-scale-day
        >
          {step.label}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {labels.typical} <span data-scale-typical>{step.typical}</span> · {labels.busy}{' '}
          <span data-scale-busy>{step.busy}</span> {labels.unit} ·{' '}
          <span data-scale-days>{step.sampleDays}</span> {labels.days}
        </span>
      </div>

      {/* The track. Height is fixed so nothing here can shift the page. */}
      <div className="relative h-16" aria-hidden>
        <div className="bg-muted absolute inset-x-0 top-6 h-4 rounded-full" />

        {/* Typical → busy. Where this ride's day usually lands. */}
        <div
          className="from-primary/45 to-primary/25 absolute top-6 h-4 rounded-full bg-gradient-to-r"
          style={{ left: 'var(--band-start)', right: 'calc(100% - var(--band-end))' }}
          data-scale-band
        />

        {/* The number at the entrance, standing wherever it stands. */}
        <div
          className="absolute top-2 h-12 w-[3px] -translate-x-1/2 rounded-full bg-amber-500 shadow-[0_0_0_3px] shadow-amber-500/20"
          style={{ left: 'var(--needle)' }}
          data-scale-needle
        />
        <div
          className="absolute top-0 -translate-x-1/2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[10px] leading-none font-bold text-white tabular-nums"
          style={{ left: 'var(--needle)' }}
        >
          {wait}
        </div>

        {/* The all-time peak. Constant across the steps: it belongs to the ride,
            not to a weekday, and it is why `busy` is a percentile and not a max. */}
        {record != null && (
          <div
            className="border-foreground/40 absolute top-5 h-6 -translate-x-1/2 border-l border-dashed"
            style={{ left: pct(record, max) }}
            title={`${labels.record} ${record} ${labels.unit}`}
          />
        )}
      </div>

      {/* Axis. Five ticks is enough to read a position off; more is a ruler. */}
      <div className="text-muted-foreground/70 relative mt-1 h-4 text-[10px] tabular-nums">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <span
            key={f}
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${f * 100}%` }}
          >
            {Math.round(f * max)}
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * The sticky copy on wide screens, plus the observer that decides which step it
 * is showing. Children are the step blocks; each one must carry
 * `data-wait-step="<id>"` matching a step's id.
 */
export function WaitScaleStage({
  steps,
  wait,
  max,
  record,
  labels,
  legend,
  children,
}: {
  steps: WaitScaleStep[];
  wait: number;
  max: number;
  record?: number;
  labels: BarLabels;
  /** What the two marks on the bar mean. Sits under it in the sticky card. */
  legend: Array<{ term: string; def: string; swatch: string }>;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  /** What the bar currently shows, so a repeat notification is a no-op. */
  const shownRef = useRef<string>(steps[0]?.id ?? '');

  useEffect(() => {
    const root = rootRef.current;
    const figure = figureRef.current;
    if (!root || !figure || steps.length < 2) return;

    const stepEls = Array.from(root.querySelectorAll<HTMLElement>('[data-wait-step]'));
    if (stepEls.length === 0) return;

    const byId = new Map(steps.map((s) => [s.id, s]));
    const surface = figure.querySelector<HTMLElement>('[data-wait-scale="stage"]');
    if (!surface) return;

    const dayEl = surface.querySelector<HTMLElement>('[data-scale-day]');
    const typicalEl = surface.querySelector<HTMLElement>('[data-scale-typical]');
    const busyEl = surface.querySelector<HTMLElement>('[data-scale-busy]');
    const daysEl = surface.querySelector<HTMLElement>('[data-scale-days]');
    // The track is aria-hidden, so this caption is the ONLY accessible copy of the
    // figure. It was rendered once from steps[0] and never touched again, which
    // left every reading after the first announcing Monday's numbers.
    const summaryEl = surface.querySelector<HTMLElement>('[data-scale-summary]');

    const reduced = prefersReducedMotion();

    /** Writes a reading straight to the DOM — the reduced-motion path and the tween's target. */
    const paint = (typical: number, busy: number, label: string, days: number) => {
      surface.style.setProperty('--band-start', pct(typical, max));
      surface.style.setProperty('--band-end', pct(busy, max));
      if (dayEl) dayEl.textContent = label;
      if (typicalEl) typicalEl.textContent = String(Math.round(typical));
      if (busyEl) busyEl.textContent = String(Math.round(busy));
      // Not tweened: a measured-day count easing through fractional values would
      // read as a number still being counted rather than a fact about the row.
      if (daysEl) daysEl.textContent = String(days);
    };

    let cancelled = false;
    let tween: { kill: () => void } | null = null;
    /** Interpolation state, so a mid-flight change eases from where it is. */
    const state = { typical: steps[0].typical, busy: steps[0].busy };

    const show = (id: string) => {
      if (id === shownRef.current) return;
      const next = byId.get(id);
      if (!next) return;
      shownRef.current = id;

      // Written on the step change with the settled numbers, not inside `paint()`:
      // a sentence easing through fractional minutes is noise to read out.
      if (summaryEl) {
        summaryEl.textContent = labels.summary
          .replace('{label}', next.label)
          .replace('{typical}', String(next.typical))
          .replace('{busy}', String(next.busy))
          .replace('{days}', String(next.sampleDays))
          .replace('{wait}', String(wait));
      }

      if (reduced) {
        state.typical = next.typical;
        state.busy = next.busy;
        paint(next.typical, next.busy, next.label, next.sampleDays);
        return;
      }

      // The day name flips at once: it labels the reading, and a name easing
      // through intermediate values would be nonsense. The two numbers count.
      if (dayEl) dayEl.textContent = next.label;

      loadGsap().then((gsap) => {
        if (cancelled || !gsap || shownRef.current !== id) return;
        tween?.kill();
        tween = gsap.to(state, {
          typical: next.typical,
          busy: next.busy,
          duration: 0.55,
          ease: 'power2.inOut',
          onUpdate: () => paint(state.typical, state.busy, next.label, next.sampleDays),
        });
      });
    };

    // A step owns the bar while its block is in the middle band of the viewport.
    // Bottom-heavy margins so the switch happens as the reader arrives at a
    // block rather than as it leaves the one above.
    const io = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        const id = active?.target.getAttribute('data-wait-step');
        if (id) show(id);
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    stepEls.forEach((el) => io.observe(el));

    return () => {
      cancelled = true;
      io.disconnect();
      tween?.kill();
    };
  }, [steps, max, wait, labels.summary]);

  return (
    <div ref={rootRef} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Sticky on wide screens; hidden below lg, where each step carries its own bar. */}
      <div ref={figureRef} className="hidden lg:block">
        <div className="bg-card/60 sticky top-20 rounded-2xl border p-6">
          <WaitScaleBar
            step={steps[0]}
            wait={wait}
            max={max}
            record={record}
            labels={labels}
            interactive
          />
          <dl className="mt-6 space-y-2.5 border-t pt-5 text-xs leading-relaxed">
            {legend.map((row) => (
              <div key={row.term} className="flex gap-2.5">
                <span
                  aria-hidden
                  className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-sm', row.swatch)}
                />
                <div>
                  <dt className="text-foreground inline font-semibold">{row.term}</dt>{' '}
                  <dd className="text-muted-foreground inline">{row.def}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="space-y-16 lg:space-y-40">{children}</div>
    </div>
  );
}
