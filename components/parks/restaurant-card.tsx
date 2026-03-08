import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FavoriteStar } from '@/components/common/favorite-star';
import { stripNewPrefix } from '@/lib/utils';

interface RestaurantCardProps {
  id: string;
  name: string;
  cuisineType?: string | null;
}

export function RestaurantCard({ id, name, cuisineType }: RestaurantCardProps) {
  return (
    <Card className="relative">
      <div className="absolute top-2 right-2 z-20 flex items-center justify-center">
        <FavoriteStar type="restaurant" id={id} />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{stripNewPrefix(name)}</h3>
        {cuisineType && (
          <Badge variant="secondary" className="mt-2 text-xs">
            {cuisineType}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
