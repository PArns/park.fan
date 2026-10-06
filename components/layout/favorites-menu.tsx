'use client';

import { memo, useId } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MenuBand } from '@/components/layout/menu-band';
import { headerNavInk } from '@/components/layout/nav-menu';
import { FavoritesMenuPanel } from '@/components/layout/favorites-menu-panel';
import { useFavoriteCounts } from '@/lib/hooks/use-favorite-counts';
import { useMenuTrigger } from '@/lib/hooks/use-menu-trigger';

/**
 * The favorites entry in the header's nav row, opening the same full-width band as the others, on
 * hover with the same hysteresis (`useMenuTrigger`). A button, not a link: favorites are
 * per-visitor state, so there is no address it can promise (`NavMenu` rule 2). The star renders
 * even at zero, because the cookie is readable only after mount and an entry that appears after
 * hydration would shift the row. `floating` sets the ink and nothing else. Memoised for the same
 * reason as `ParksMenuPanel`.
 */
export const FavoritesMenu = memo(function FavoritesMenu({ floating }: { floating?: boolean }) {
  const t = useTranslations('favorites');
  const panelId = useId();
  const counts = useFavoriteCounts();
  const { open, triggerProps, toggle, closeOnSamePageClick } = useMenuTrigger();

  return (
    <div {...triggerProps}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('title')}
        onClick={toggle}
        /* `gap-2.5`: the count bubble sticks out to the right of the star and would sit on the
           chevron. It is absolutely positioned, so the gap is the same at any count. */
        className={`flex cursor-pointer items-center gap-2.5 text-sm font-medium transition-colors duration-200 ${headerNavInk(floating)}`}
      >
        {/* The count sits on the star, not beside it, so the trigger's width stays constant and
            no neighbour in the row moves when somebody stars something. */}
        <span className="relative flex items-center">
          {/* Gold, not primary: the same star as `FavoriteStar` on every park and ride page, and
              in blue it would merge with the blue count bubble. */}
          <Star
            className={`h-4 w-4 ${counts.total > 0 ? 'fill-amber-400 text-amber-500' : ''}`}
            aria-hidden="true"
          />
          {counts.total > 0 && (
            /* The ring cuts the bubble out of the star (`ring-background` is the bar's colour), or
               the filled star tip and the bubble run into one blot. The bubble sits in the top
               right corner and is as small as two digits allow, so the star stays visible. */
            <span className="bg-primary text-primary-foreground ring-background absolute -top-2 -right-2.5 min-w-[14px] rounded-full px-[3px] text-center text-[9px] leading-[14px] font-semibold tabular-nums ring-2">
              {counts.total}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <MenuBand id={panelId} open={open} onClick={closeOnSamePageClick}>
        <FavoritesMenuPanel open={open} />
      </MenuBand>
    </div>
  );
});
