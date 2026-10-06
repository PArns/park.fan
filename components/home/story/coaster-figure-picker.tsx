'use client';

import { useEffect, useRef, useState } from 'react';
import { useAfterLoad } from '@/lib/hooks/use-after-load';
import { ArrowRight, Play } from 'lucide-react';
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
 * Figure list plus the glossary's real 3-D player, so a figure retuned in
 * `lib/three/coaster/elements.ts` moves in both places. The player is not mounted until the reader
 * is nearly at it, because `next/dynamic` fetches the three.js chunk on mount: the stage arms on
 * scroll, with the observer started only after load and a 150 px margin, or on a click. The
 * un-armed stage keeps the player's box. No reduced-motion branch: the scene starts paused itself.
 * Switching figures re-keys the player, since the scene builds its geometry on mount.
 */
export function CoasterFigurePicker({
  figures,
  labels,
  pickerTitle,
  ctaLabel,
  ctaHref,
  stageLabel,
}: {
  figures: PickableFigure[];
  labels: CoasterPlayerLabels;
  pickerTitle: string;
  ctaLabel: string;
  ctaHref: string;
  /** Call to action on the un-armed stage, e.g. "Figur abspielen". */
  stageLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [armed, setArmed] = useState(false);
  const afterLoad = useAfterLoad();
  const stageRef = useRef<HTMLDivElement>(null);
  const current = figures[active];

  useEffect(() => {
    if (armed || !afterLoad) return;
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: '150px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed, afterLoad]);

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
              onClick={() => {
                setActive(i);
                setArmed(true);
              }}
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

      <div ref={stageRef}>
        {armed ? (
          <CoasterPlayer key={current.element} element={current.element} labels={labels} />
        ) : (
          // Same box as the player's own loading shell (aspect stage + the 57 px
          // transport row), so arming it swaps rather than grows.
          <button
            type="button"
            onClick={() => setArmed(true)}
            className="border-primary/15 bg-muted/40 hover:border-primary/40 w-full overflow-hidden rounded-xl border text-left transition-colors"
          >
            <span className="text-muted-foreground flex aspect-[16/10] w-full items-center justify-center gap-2 text-sm font-medium sm:aspect-[16/9]">
              <Play className="h-4 w-4" aria-hidden="true" />
              {stageLabel}
            </span>
            <span className="block border-t px-3 py-2.5">
              <span className="block h-9" />
            </span>
          </button>
        )}
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
