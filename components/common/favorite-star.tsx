'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { isFavorite, toggleFavorite, type FavoriteType } from '@/lib/utils/favorites';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { trackFavoriteAdd, trackFavoriteRemove, trackEvent } from '@/lib/analytics/umami';

interface FavoriteStarProps {
  type: FavoriteType;
  id: string;
  name?: string; // Optional: Name of the entity for analytics
  className?: string;
  onToggle?: (isFavorite: boolean) => void;
  size?: 'sm' | 'md' | 'lg'; // Size variant
  noCircle?: boolean; // Remove circle background/border
}

export function FavoriteStar({
  type,
  id,
  name,
  className,
  onToggle,
  size = 'md',
  noCircle = true,
}: FavoriteStarProps) {
  const [isFav, setIsFav] = useState(false);
  const t = useTranslations('favorites');

  // Initialize state from cookies
  useEffect(() => {
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

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newState = await toggleFavorite(type, id);
    setIsFav(newState);
    onToggle?.(newState);

    // Track event in Umami with optional name
    if (newState) {
      trackFavoriteAdd(type, id);
      // Track additional event with name for analytics
      if (name) {
        trackEvent('favorite_item_added', { type, name });
      }
    } else {
      trackFavoriteRemove(type, id);
      // Track additional event with name for analytics
      if (name) {
        trackEvent('favorite_item_removed', { type, name });
      }
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeClasses[size];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={handleClick}
          className={cn(
            'z-10 flex items-center justify-center transition-all hover:scale-110',
            'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
            !noCircle && 'border-border/50 hover:border-border rounded-full border p-1 shadow-md',
            className
          )}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <Star
            className={cn(
              iconSize,
              'transition-all',
              isFav
                ? 'fill-amber-400 text-amber-500'
                : 'fill-muted-foreground/20 text-muted-foreground'
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">
        <p>{t('tooltip')}</p>
      </TooltipContent>
    </Tooltip>
  );
}
