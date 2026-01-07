'use client';

import { FavoriteStar } from '@/components/common/favorite-star';

interface ParkFavoriteButtonProps {
  parkId: string;
}

export function ParkFavoriteButton({ parkId }: ParkFavoriteButtonProps) {
  return (
    <div className="flex items-center">
      <FavoriteStar type="park" id={parkId} size="lg" />
    </div>
  );
}
