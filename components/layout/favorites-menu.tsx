'use client';

import { useId } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MenuBand } from '@/components/layout/menu-band';
import { FavoritesMenuPanel } from '@/components/layout/favorites-menu-panel';
import { useFavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';

/**
 * The favorites entry in the header's nav row, opening the same full-width band the others do.
 *
 * Why it is here at all: starring something is the only piece of state this site keeps about a
 * visitor, and until this existed the only place it was ever shown was a band two screens down
 * the homepage. From a park page — the page where somebody presses the star — there was no way
 * back to what they had starred.
 *
 * It sits in the nav row rather than in the actions cluster, and it opens on hover with the same
 * hysteresis as "Parks entdecken" and "Blog" (`useMenuTrigger`), because a row where one entry
 * behaves differently from its neighbours is a row you have to learn twice.
 *
 * **It is the one entry that is not a link, and that is deliberate.** Every other trigger goes
 * somewhere whether or not the panel opens — for a keyboard, for a touch screen, for the crawler.
 * Favorites have no such destination: they are per-visitor state living in a cookie, there is no
 * page to crawl, and pointing this at the homepage's favorites band would promise a URL that
 * answers differently for every reader. So the trigger is a button, and the panel is the whole
 * feature.
 *
 * The star is rendered even at zero favorites: the nav row is laid out on the server, the cookie
 * is readable only after mount, and an entry that materialises after hydration shifts every
 * sibling in the row. It is also the only advertisement the feature gets — the empty panel says
 * what the star does.
 */
export function FavoritesMenu({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('favorites');
  const panelId = useId();
  const counts = useFavoriteCounts();
  const { open, triggerProps, toggle } = useMenuTrigger({ disabled });

  return (
    <div {...triggerProps}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('title')}
        tabIndex={disabled ? -1 : 0}
        onClick={toggle}
        data-header-stagger
        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
      >
        {/* Der Zähler sitzt AUF dem Stern, nicht daneben. Als Geschwister war er eine zweite
            Marke in der Zeile — und er hätte den Eintrag breiter gemacht, sobald jemand etwas
            markiert, was jeden Nachbarn in der Navigationszeile verschoben hätte. Absolut
            positioniert ist die Breite des Auslösers konstant, ob null oder acht Favoriten. */}
        <span className="relative flex items-center">
          <Star
            className={`h-4 w-4 ${counts.total > 0 ? 'fill-primary text-primary' : ''}`}
            aria-hidden="true"
          />
          {counts.total > 0 && (
            <span className="bg-primary text-primary-foreground absolute -top-1.5 -right-2 min-w-[15px] rounded-full px-[3px] text-center text-[10px] leading-[15px] font-semibold tabular-nums">
              {counts.total}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <MenuBand id={panelId} open={open}>
        <FavoritesMenuPanel open={open} />
      </MenuBand>
    </div>
  );
}
