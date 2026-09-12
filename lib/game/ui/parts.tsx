'use client';

/**
 * The small pieces every panel is built from.
 *
 * They exist so that a figure looks the same in the top bar, in the park panel and in a foreign
 * module's panel — which is the whole argument for a registry rather than a folder of bespoke
 * panels. A module that registers one of these gets the HUD's material for free and cannot
 * accidentally invent a fifth shade of grey or a second kind of button.
 *
 * Everything here is built on the site's own components (`@/components/ui/button`) and the
 * recipes in `surface.ts`. There is no second button in this file and there must not be one.
 *
 * ## Raised or sunk, and never in between
 *
 * `Figure`, `FigureTile`, `Meter` and `Chip` are SUNK: they are telling you something.
 * `HudButton` and `HudIconButton` are RAISED: you can press them. That is the whole vocabulary,
 * and it is what lets a reader tell a control from a readout before reading either.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  GROOVE,
  GROOVE_FILL,
  HAIRLINE,
  HUD_LABEL,
  HUD_VALUE,
  LABEL_BAND,
  SINK,
  TONE_DOT,
  TONE_FILL,
  TONE_TEXT,
  raise,
  type Tone,
} from './surface';

/** A number with its label under it. The label is the small one; the number is the point. */
export function Figure({
  label,
  value,
  tone = 'neutral',
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)} title={hint}>
      <div className={cn(HUD_VALUE, 'truncate text-[15px] leading-tight', TONE_TEXT[tone])}>
        {value}
      </div>
      <div className={cn(HUD_LABEL, 'mt-1 truncate')}>{label}</div>
    </div>
  );
}

/**
 * The same, boxed — and the box is a groove with the label on its own band.
 *
 * Two zones rather than one: the value sits on the groove's fill, the label on a darker strip
 * across the bottom that runs to both edges. A 9.5 px label floating on a translucent tray is at
 * the mercy of whatever sky is behind it; on its own band it measured 6.88:1 with a blown-out
 * cloud directly behind. Tone colours the VALUE only, never the tile — a tile that turns red is
 * an alarm, and a queue of 204 people is a fact.
 */
export function FigureTile({
  label,
  value,
  tone = 'neutral',
  hint,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
  /** Sits to the left of the value, at a third of its weight. */
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(SINK, 'flex min-w-0 flex-col overflow-hidden px-2 pt-1', className)}
      title={hint}
    >
      <div
        className={cn(
          HUD_VALUE,
          'flex items-center gap-1.5 pb-0.5 text-[14px] leading-tight',
          TONE_TEXT[tone]
        )}
      >
        {icon ? <span className="shrink-0 text-white/32">{icon}</span> : null}
        <span className="truncate">{value}</span>
      </div>
      <div className={cn(LABEL_BAND, '-mx-2 truncate px-2 pt-[3px] pb-[3px]')}>{label}</div>
    </div>
  );
}

/**
 * A labelled bar.
 *
 * The number sits beside the label rather than inside the bar: a value written on a fill that
 * moves is unreadable exactly when the fill is short, which is when the reader most wants it.
 * The track is 11 px because under this bevel a 6 px bar reads as a scratch in the plastic rather
 * than as a groove with something in it.
 */
export function Meter({
  label,
  value,
  fraction,
  tone = 'neutral',
  className,
}: {
  label?: string;
  value?: ReactNode;
  /** 0..1. */
  fraction: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className={cn('min-w-0', className)}>
      {label || value ? (
        <div className="mb-1 flex items-center gap-2">
          {label ? <span className={cn(HUD_LABEL, 'truncate')}>{label}</span> : null}
          <span className={HAIRLINE} />
          {value ? (
            <span className={cn('shrink-0 text-[11.5px] font-bold tabular-nums', TONE_TEXT[tone])}>
              {value}
            </span>
          ) : null}
        </div>
      ) : null}
      <div className={cn(GROOVE, 'w-full')}>
        <div
          className={cn(GROOVE_FILL, 'transition-[width] duration-300', TONE_FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusDot({ tone = 'neutral', className }: { tone?: Tone; className?: string }) {
  return (
    <span
      className={cn(
        'size-2 shrink-0 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_rgb(0_0_0/0.45)]',
        TONE_DOT[tone],
        className
      )}
    />
  );
}

/**
 * A label above a group, with a rule running from it to the right edge.
 *
 * The rule is what turns a label into a chapter opening rather than a caption on the row under
 * it, and it is two lines — a hairline plus a dark one under it — because a single hairline on a
 * translucent body disappears over a bright sky. `action` is the one control a section header may
 * carry.
 */
export function Section({
  label,
  action,
  children,
  className,
}: {
  label?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label || action ? (
        <div className="flex items-center gap-2">
          {label ? <h3 className={HUD_LABEL}>{label}</h3> : null}
          <span className={HAIRLINE} />
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Label on the left, value on the right. The workhorse of every inspector. */
export function DataRow({
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <div
      className="flex items-baseline justify-between gap-3 border-t border-white/[0.055] py-[3px] first:border-t-0"
      title={hint}
    >
      <span className="min-w-0 truncate text-xs text-white/62">{label}</span>
      <span className={cn('shrink-0 text-[12.5px] font-semibold tabular-nums', TONE_TEXT[tone])}>
        {value}
      </span>
    </div>
  );
}

/**
 * A muted line where a panel has nothing to say.
 *
 * It says what is missing and, where there is one, what would fill it. An empty box with no words
 * in it is indistinguishable from a panel that failed to load, which is the state this replaces.
 */
export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="px-1 py-3 text-xs leading-relaxed text-white/55">{children}</p>;
}

/** A small sunk pill. Not `Badge`, which is a page's component and not a groove. */
export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        SINK,
        'inline-flex h-[17px] shrink-0 items-center rounded-[5px] px-1.5 text-[10.5px] font-semibold tabular-nums',
        TONE_TEXT[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * An icon control, moulded.
 *
 * Two densities and both come off the shared scale in `components/ui/button.tsx`: `chrome` is the
 * `icon` step (36 px, 44 below `sm`) for the clusters that float over the park, `panel` is
 * `icon-sm` (32 px, 44 below `sm`) for the header of a panel and the controls inside one. Nothing
 * here invents a height, and the phone tier is kept rather than cancelled: these clusters are
 * trays with room, not the site header's 48 px bar, which is the one place the repo documents an
 * exception.
 *
 * `active` is ON — a state that persists. `armed` is what the next click on the park does, and
 * exactly one of those exists at a time.
 */
export function HudIconButton({
  label,
  active,
  armed,
  density = 'panel',
  onClick,
  children,
  className,
  disabled,
}: {
  label: string;
  active?: boolean;
  armed?: boolean;
  /** `chrome` for the clusters over the park, `panel` inside a panel. */
  density?: 'chrome' | 'panel';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size={density === 'chrome' ? 'icon' : 'icon-sm'}
      variant="ghost"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(raise({ on: active, armed }), className)}
    >
      {children}
    </Button>
  );
}

/**
 * A text control at the HUD's size, and the pair reads as two keys of one moulding.
 *
 * The difference between the primary and the secondary is illumination, never shape or size: both
 * are 36 px, both carry the same bevel, and the primary is the one that is switched on. There is
 * no ghost variant — a ghost button over a moving park is invisible half the time, which is
 * exactly the moment a player is looking for the button.
 */
export function HudButton({
  children,
  onClick,
  variant = 'secondary',
  className,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      size="default"
      variant="ghost"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        raise({ on: variant === 'primary', danger: variant === 'danger' }),
        'gap-1.5 px-3 text-[12.5px] font-semibold',
        className
      )}
    >
      {children}
    </Button>
  );
}

/**
 * A distribution bar: one segment per category, widths in proportion.
 *
 * Used for the crowd breakdown, where the interesting quantity is the *share* queuing rather than
 * the count, and eight numbers in a column do not show a share at all. Same groove as `Meter`, so
 * the two read as one instrument even though one of them has five colours in it.
 */
export function StackBar({
  segments,
  className,
}: {
  segments: { key: string; value: number; className: string; label: string }[];
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;
  return (
    <div className={cn(GROOVE, 'flex w-full', className)}>
      {segments.map((s) =>
        s.value > 0 ? (
          <div
            key={s.key}
            className={cn(
              'h-full bg-[image:linear-gradient(180deg,rgb(255_255_255/0.3),rgb(255_255_255/0)_52%,rgb(0_0_0/0.18))]',
              s.className
            )}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${s.value}`}
          />
        ) : null
      )}
    </div>
  );
}
