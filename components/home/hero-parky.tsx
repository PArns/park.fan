'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { ParkyLogo } from '@/components/assistant/parky-logo';
import { assistantGate } from '@/lib/assistant/config';
import { openParky } from '@/lib/assistant/open';
import { parkyDock, parkyInDock } from '@/lib/assistant/parky-dock';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { cn } from '@/lib/utils';

/** Share of the slot on screen from which Parky stands in it rather than in his corner. */
const ON_SCREEN_RATIO = 0.5;

/**
 * Parky in the homepage hero on a desktop, under the headline: big, beside a speech bubble with an
 * invitation, and the two together a button that opens his chat window, into which he hops from
 * here. The slot registers with `parkyDock` while at least half of it is on screen; meanwhile the
 * corner button is hidden, and once it scrolls away Parky hops down into his corner and back up
 * when it returns (`AssistantLauncher`). He is drawn only while he stands here (`parkyInDock`), so
 * on his way in, up in the window or back in the corner the slot is empty and the bubble faded.
 *
 * Calm, as in the chat window: his eyes follow the pointer, he blinks, looks around, searches along
 * with an open search and dozes off, but takes no rides. The row reserves its height from `lg`
 * whether or not Parky comes, so his arrival moves nothing; it stays empty below `lg` and for a
 * browser outside the rollout.
 */
export function HeroParky() {
  const t = useTranslations('home');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const gateOpen = useSyncExternalStore(
    assistantGate.subscribe,
    assistantGate.getSnapshot,
    assistantGate.getServerSnapshot
  );
  const present = useSyncExternalStore(
    parkyInDock.subscribe,
    parkyInDock.getSnapshot,
    parkyInDock.getServerSnapshot
  );
  const active = desktop && gateOpen;
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!active || !slot) return;
    const observer = new IntersectionObserver(
      ([entry]) => parkyDock.set(entry.intersectionRatio >= ON_SCREEN_RATIO ? slot : null),
      { threshold: [0, ON_SCREEN_RATIO, 1] }
    );
    observer.observe(slot);
    return () => {
      observer.disconnect();
      parkyDock.set(null);
    };
  }, [active]);

  return (
    // `h-28` holds Parky's 96 px and the hat and Zs that rise above his drawing, so nothing of him
    // is cut and the row is one height before and after he arrives.
    <div className="hidden h-28 items-end lg:flex">
      {active && (
        <button
          type="button"
          onClick={() => openParky('hero')}
          className="group focus-visible:ring-primary-ink flex items-end gap-5 rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
        >
          <span ref={slotRef} className="relative grid size-24 shrink-0">
            {present && (
              <span className="animate-in fade-in grid size-full duration-200">
                <ParkyLogo
                  idle
                  calm
                  className="size-full drop-shadow-[0_8px_18px_rgb(0_0_0/0.4)]"
                />
              </span>
            )}
          </span>
          {/* White with dark text in either theme, a comic's speech bubble like the corner's, its
              tail at Parky's mouth. */}
          <span
            className={cn(
              'relative mb-3 flex flex-col gap-1 rounded-3xl border border-black/10 bg-white px-6 py-4 text-neutral-900 shadow-2xl',
              'origin-[0%_60%] transition-[opacity,transform,translate] duration-300 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none',
              present ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
            )}
          >
            <span className="text-xl leading-snug font-bold tracking-tight text-balance xl:text-2xl">
              {t('hero.parkyLine')}
            </span>
            {/* Fixed dark text, as the bubble is white in both themes. */}
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600">
              <MessageCircle aria-hidden="true" className="text-primary size-4" />
              {t('hero.parkyCta')}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 -left-2 size-4 rotate-45 border-b border-l border-black/10 bg-white"
            />
          </span>
        </button>
      )}
    </div>
  );
}
