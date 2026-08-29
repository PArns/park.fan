'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';
import { MenuBand } from '@/components/layout/menu-band';
import { FavoritesMenuPanel } from '@/components/layout/favorites-menu-panel';
import { useFavoriteCounts } from '@/lib/hooks/use-favorite-counts';

/**
 * The favorites trigger in the header's actions cluster, opening the same full-width band the
 * nav entries do.
 *
 * Why it is here at all: starring something is the only piece of state this site keeps about a
 * visitor, and until now the only place it was ever shown was a band two screens down the
 * homepage. From a park page — the page where somebody actually presses the star — there was no
 * way back to what they had starred.
 *
 * Why it is a permanent icon and not one that appears once there is something to show: the
 * actions cluster is laid out on the server, the cookie is readable only after mount, and a
 * control that materialises after hydration pushes the locale switcher, the theme toggle and the
 * burger sideways on every page load. A star that is always there costs 32 px and is also the
 * only advertisement the feature gets — the empty panel says what the star does.
 *
 * Unlike `NavMenu` this opens on CLICK only, never on hover. Its panel is the one thing in the
 * bar that is about the visitor rather than about the site, it sits between the search field and
 * the theme toggle, and a band that unrolled every time a pointer crossed on its way to the theme
 * toggle would be in the way several times a session. The count badge is the hover affordance.
 */
export function FavoritesMenu({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('favorites');
  const pathname = usePathname();
  // The path the band was opened on — see `NavMenu` for why this is not a boolean. Short
  // version: the header outlives the navigation, so a boolean would need an effect to clear it.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const requested = openedOn === pathname;
  // Same derivation as `NavMenu`: a panel hanging open while the header floats transparent would
  // sit over the hero attached to nothing.
  const open = requested && !disabled;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const counts = useFavoriteCounts();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenedOn(null);
        rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpenedOn(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={t('title')}
        tabIndex={disabled ? -1 : 0}
        onClick={() => setOpenedOn(requested ? null : pathname)}
        data-header-stagger
        className="text-muted-foreground hover:text-foreground hover:bg-accent/50 relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors"
      >
        <Star
          className={`h-4 w-4 ${counts.total > 0 ? 'fill-primary text-primary' : ''}`}
          aria-hidden="true"
        />
        {counts.total > 0 && (
          <span className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 min-w-4 rounded-full px-1 text-[10px] leading-4 font-semibold tabular-nums">
            {counts.total}
          </span>
        )}
      </button>

      <MenuBand id={panelId} open={open}>
        <FavoritesMenuPanel open={open} />
      </MenuBand>
    </div>
  );
}
