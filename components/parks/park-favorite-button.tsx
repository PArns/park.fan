import { FavoriteStar } from '@/components/common/favorite-star';

interface ParkFavoriteButtonProps {
  parkId: string;
}

/** The large favorite star for a park, as the park page's title header shows it. */
export function ParkFavoriteButton({ parkId }: ParkFavoriteButtonProps) {
  return (
    <div className="flex items-center">
      <FavoriteStar type="park" id={parkId} size="lg" />
    </div>
  );
}
