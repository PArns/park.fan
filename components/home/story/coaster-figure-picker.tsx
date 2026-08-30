'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CoasterPlayer, type CoasterPlayerLabels } from '@/components/glossary/coaster-player';
import { cn } from '@/lib/utils';

export interface PickableFigure {
  /** Glossary term id — also the key into the coaster-element registry. */
  id: string;
  /** Coaster element to animate. */
  element: string;
  name: string;
  shortDefinition: string;
  /** Localized href of the term's own page. */
  href: string;
}

/**
 * Figure list plus the site's real 3-D player.
 *
 * The player is the one from the glossary (`components/glossary/coaster-player`),
 * not a second drawing of the same figures: it already code-splits three.js
 * behind an `ssr:false` dynamic import with a matching-shape skeleton, so the
 * homepage pays for the engine only once somebody scrolls here, and a figure
 * retuned in `lib/three/coaster/elements.ts` moves in both places at once.
 *
 * Switching figures re-keys the player deliberately — the scene builds its
 * geometry from the element on mount, so a swapped prop alone would keep the
 * previous track.
 */
export function CoasterFigurePicker({
  figures,
  labels,
  pickerTitle,
  ctaLabel,
  ctaHref,
}: {
  figures: PickableFigure[];
  labels: CoasterPlayerLabels;
  pickerTitle: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const [active, setActive] = useState(0);
  const current = figures[active];

  if (!current) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
      <div>
        <div className="text-muted-foreground mb-3 text-[11px] font-bold tracking-[0.1em] uppercase">
          {pickerTitle}
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {figures.map((figure, i) => (
            <button
              key={figure.id}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              className={cn(
                'rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors lg:w-full',
                i === active
                  ? 'border-primary/50 bg-primary/10 text-foreground'
                  : 'border-border bg-card/55 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span className="block font-semibold">{figure.name}</span>
              <span className="hidden text-xs lg:block">{figure.shortDefinition}</span>
            </button>
          ))}
        </div>

        <Link
          href={ctaHref as '/'}
          prefetch={false}
          className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div>
        <CoasterPlayer key={current.element} element={current.element} labels={labels} />
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          <Link
            href={current.href as '/'}
            prefetch={false}
            className="text-foreground font-semibold hover:underline"
          >
            {current.name}
          </Link>
          <span aria-hidden="true"> · </span>
          {current.shortDefinition}
        </p>
      </div>
    </div>
  );
}
