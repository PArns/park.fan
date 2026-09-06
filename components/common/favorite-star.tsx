'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { isFavorite, toggleFavorite, type FavoriteType } from '@/lib/utils/favorites';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { trackFavoriteAdd, trackFavoriteRemove } from '@/lib/analytics/umami';

interface FavoriteStarProps {
  type: FavoriteType;
  id: string;
  name?: string; // Optional: Name of the entity for analytics
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg'; // Size variant
  noCircle?: boolean; // Remove circle background/border
  /** Glass variant: uses theme-aware translucent icon colors for glass/photo backgrounds. */
  variant?: 'default' | 'glass';
}

export function FavoriteStar({
  type,
  id,
  name,
  className,
  onToggle,
  size = 'md',
  noCircle = true,
  variant = 'default',
}: FavoriteStarProps) {
  const [isFav, setIsFav] = useState(false);
  const t = useTranslations('favorites');

  // Initialize state from cookies (effect only, so SSR/hydration render the default)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFav(isFavorite(type, id));
  }, [type, id]);

  // Listen for favorites-changed events
  useEffect(() => {
    const handleFavoritesChanged = () => {
      setIsFav(isFavorite(type, id));
    };

    window.addEventListener('favorites-changed', handleFavoritesChanged);
    return () => {
      window.removeEventListener('favorites-changed', handleFavoritesChanged);
    };
  }, [type, id]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newState = toggleFavorite(type, id);
      setIsFav(newState);
      onToggle?.(newState);

      if (newState) {
        trackFavoriteAdd(type, name);
      } else {
        trackFavoriteRemove(type, name);
      }
    },
    [type, id, name, onToggle]
  );

  // Size variants
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeClasses[size];

  // Native `title` instead of a Radix Tooltip: a FavoriteStar sits on every park/attraction
  // card, so a Radix tooltip here means one tooltip instance hydrating per card (× 100+ on big
  // park pages). The card surface already uses native `title` for the same reason — this keeps
  // the hint + a11y label without the per-card client hydration cost.
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'relative z-10 flex items-center justify-center transition-all hover:scale-110',
        'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
        // The hit area, not the star. With the circle this button was 24 px (a 16 px icon in
        // `p-1`), and on the show, restaurant and in-park cards it sits INSIDE the card's own
        // `<Link>` — the click handler stops propagation, so hitting it is fine, but missing it by
        // four pixels navigated away instead of favouriting. 44 px below `sm` is the same number
        // the button scale carries.
        //
        // The target grows, the BOX does not, the same split `BreadcrumbNav` and `PlannerBlock`
        // make: a `max-sm:min-h-11 max-sm:min-w-11` grew the button itself, and every call site
        // here hands it a box that is not 44 px. `ParkCard` and `AttractionCard` put it in their
        // own 34 px circle, and a 44 px button anchored to that circle's top-left centres the
        // star 6 px right and 6 px down of it — measured on all 19 rides of a park page and all
        // 12 cards of the homepage, which is the star hanging out of its ring in the corner of
        // every card on every phone. The show, restaurant and in-park cards anchor an
        // `absolute top-2 right-2` wrapper by ITS top-right instead, so there the same 28 px
        // pushed the star down and to the left, into the card. A pseudo-element takes the finger
        // and the box keeps whatever size its call site gave it.
        'max-sm:after:absolute max-sm:after:top-1/2 max-sm:after:left-1/2 max-sm:after:h-11',
        'max-sm:after:w-11 max-sm:after:-translate-x-1/2 max-sm:after:-translate-y-1/2',
        'max-sm:after:content-[""]',
        !noCircle && 'border-border/50 hover:border-border rounded-full border p-1 shadow-md',
        className
      )}
      aria-label={isFav ? t('removeFromFavorites') : t('addToFavorites')}
      aria-pressed={isFav}
      title={t('tooltip')}
    >
      <Star
        className={cn(
          iconSize,
          'transition-all',
          isFav
            ? 'fill-amber-400 text-amber-500'
            : variant === 'glass'
              ? 'fill-black/10 text-black/40 dark:fill-white/20 dark:text-white/45'
              : 'fill-muted-foreground/20 text-muted-foreground'
        )}
      />
    </button>
  );
}
