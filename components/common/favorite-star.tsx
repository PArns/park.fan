'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Star } from 'lucide-react';
import {
  isFavorite,
  subscribeToFavorites,
  toggleFavorite,
  type FavoriteType,
} from '@/lib/utils/favorites';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { trackFavoriteAdd, trackFavoriteRemove } from '@/lib/analytics/umami';

interface FavoriteStarProps {
  type: FavoriteType;
  id: string;
  name?: string; // Optional: Name of the entity for analytics
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  noCircle?: boolean; // Remove circle background/border
  /** Glass variant: uses theme-aware translucent icon colors for glass/photo backgrounds. */
  variant?: 'default' | 'glass';
}

/**
 * Star button that adds or removes a park, ride, show or restaurant from the visitor's favourites,
 * reads its state from the favourites store and tracks the change in Umami.
 */
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
  const isFav = useSyncExternalStore(
    subscribeToFavorites,
    () => isFavorite(type, id),
    () => false
  );
  const t = useTranslations('favorites');

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const newState = toggleFavorite(type, id);
      onToggle?.(newState);

      if (newState) {
        trackFavoriteAdd(type, name);
      } else {
        trackFavoriteRemove(type, name);
      }
    },
    [type, id, name, onToggle]
  );

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
        // The hit area, not the star: the star often sits inside a card's `<Link>`, where a near
        // miss navigates instead of favouriting. Below `sm` a pseudo-element gives it 44 px while
        // the box keeps the size its call site gave it, since a grown box shifts the star out of
        // the card's circle.
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
