'use client';

import { useState } from 'react';
// Glossary URLs carry their own locale segment and are served by a next.config
// rewrite, so the i18n <Link> would prefix the locale twice. Plain next/link,
// prefetch off, matching the app-wide default.
import Link from 'next/link';
import { ArrowRight, Rotate3d } from 'lucide-react';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import { cn } from '@/lib/utils';
import type { ResolvedElement } from '@/lib/glossary/ride-profile';
import type { ElementKind } from '@/lib/glossary/element-kinds';

/**
 * Rail colours per kind. The `--color-element-*` tokens are registered in
 * globals.css via `@theme inline`, same as `--color-status-*`.
 *
 * Written out as whole class names rather than composed from a template
 * string — Tailwind scans source text, and `bg-element-${kind}` would produce
 * no CSS at all.
 */
const KIND_CLASS: Record<ElementKind, { dot: string; text: string; ring: string }> = {
  launch: {
    dot: 'bg-element-launch',
    text: 'text-element-launch',
    ring: 'ring-element-launch/40',
  },
  airtime: {
    dot: 'bg-element-airtime',
    text: 'text-element-airtime',
    ring: 'ring-element-airtime/40',
  },
  inversion: {
    dot: 'bg-element-inversion',
    text: 'text-element-inversion',
    ring: 'ring-element-inversion/40',
  },
  turn: { dot: 'bg-element-turn', text: 'text-element-turn', ring: 'ring-element-turn/40' },
  brake: { dot: 'bg-element-brake', text: 'text-element-brake', ring: 'ring-element-brake/40' },
  other: {
    dot: 'bg-muted-foreground',
    text: 'text-muted-foreground',
    ring: 'ring-muted-foreground/40',
  },
};

export interface RideLayoutRailLabels {
  hint: string;
  has3d: string;
  openGlossary: string;
  /**
   * Accessible name for the player, per figure name.
   *
   * Formatted on the server and passed as a plain map rather than a formatter
   * function: functions cannot cross the RSC boundary, and re-implementing the
   * ICU substitution here would duplicate next-intl's job in a client bundle.
   */
  viewerTitles: Record<string, string>;
}

interface RideLayoutRailProps {
  elements: ResolvedElement[];
  playerLabels: CoasterPlayerLabels;
  labels: RideLayoutRailLabels;
}

/**
 * The ride's layout as a track you can read left to right, with a shared 3-D
 * viewer that opens in place.
 *
 * Replaces a flat list of names: nine identical rows told you what the ride
 * contains but nothing about what it feels like, and every figure was a
 * one-way trip out to the glossary.
 */
export function RideLayoutRail({ elements, playerLabels, labels }: RideLayoutRailProps) {
  // Null until the first tap. `next/dynamic` fetches the three.js chunk when
  // CoasterPlayer MOUNTS, so rendering it eagerly would pull the whole engine
  // onto every coaster page just because the ride has a profile.
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected === null ? null : (elements[selected] ?? null);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">{labels.hint}</p>

      {/* Horizontal at every width. The rail IS the ride — wrapping it into rows
          would break the left-to-right reading of the layout, so on narrow
          screens it scrolls instead. */}
      <ol
        className="-mx-1 flex snap-x snap-mandatory overflow-x-auto px-1 pt-1 pb-2"
        aria-label={labels.hint}
      >
        {elements.map((element, index) => {
          const isActive = index === selected;
          const colour = KIND_CLASS[element.kind];
          return (
            /* grow + basis rather than a fixed width: the rail spreads across
               whatever width the card gives it, so a 9-figure layout fills the
               row instead of huddling on the left. `shrink-0` with a 6rem basis
               keeps the labels readable — below that the row overflows and
               scrolls, which is what happens on a phone. */
            <li
              key={`${element.id}-${index}`}
              className="relative shrink-0 grow basis-24 snap-start"
            >
              {/* The connecting track, behind the dot. Not before the first figure. */}
              {index > 0 && (
                <span
                  aria-hidden
                  className="bg-border absolute top-4 -left-1/2 -z-10 h-0.5 w-full"
                />
              )}
              <button
                type="button"
                onClick={() => setSelected(isActive ? null : index)}
                aria-pressed={isActive}
                className="group flex w-full flex-col items-center gap-1.5 px-1 py-1 text-center"
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white tabular-nums transition-transform',
                    colour.dot,
                    isActive && cn('scale-110 ring-2 ring-offset-2', colour.ring),
                    // Figures with no scene are still real steps in the layout —
                    // dimmed, not hidden, so the ride order stays intact.
                    !element.playerElement && !isActive && 'opacity-70'
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    'text-[11px] leading-tight font-medium text-balance',
                    isActive
                      ? colour.text
                      : 'text-muted-foreground group-hover:text-foreground transition-colors'
                  )}
                >
                  {element.name}
                </span>
                {element.playerElement && (
                  <Rotate3d
                    className={cn('h-3 w-3', isActive ? colour.text : 'text-muted-foreground/70')}
                    aria-label={labels.has3d}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>

      {active && (
        <div className="border-border/60 bg-background/40 space-y-3 rounded-xl border p-4">
          {/* Name and definition come FIRST: you tap a figure to find out what it is,
              and reading that after watching the animation is the wrong way round —
              you spend the animation guessing. Now the caption sets up the scene. */}
          <div>
            <h4 className={cn('text-sm font-semibold', KIND_CLASS[active.kind].text)}>
              {active.name}
            </h4>
            <p className="text-muted-foreground mt-1 text-sm">{active.shortDefinition}</p>
          </div>
          {active.playerElement && (
            // Remounted per figure via `key`: the scene is built from the
            // element id, and a fresh mount is the honest way to swap it.
            <div role="group" aria-label={labels.viewerTitles[active.name]}>
              <CoasterPlayer
                key={active.playerElement}
                element={active.playerElement}
                labels={playerLabels}
              />
            </div>
          )}
          <Link
            href={active.href}
            prefetch={false}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {labels.openGlossary}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
