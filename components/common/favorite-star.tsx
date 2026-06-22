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
        trackFavoriteAdd(type, id, name);
      } else {
        trackFavoriteRemove(type, id, name);
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
        'z-10 flex items-center justify-center transition-all hover:scale-110',
        'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
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
