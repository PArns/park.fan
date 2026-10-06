import { Camera, Coffee, MapPin, ShoppingBag, Sparkles, Theater, Utensils } from 'lucide-react';
import type { PlannerBlockIcon } from '@/lib/planner/types';

/**
 * The icons a free block may carry, mapped in one place, because the plan stores the key and not
 * the component; `store.ts` falls back on an unknown key rather than dropping the block. `Theater`
 * is the mark the show band and show lines use, so a block for a show looks like the shows.
 */
export const PLANNER_BLOCK_ICON_COMPONENTS: Record<
  PlannerBlockIcon,
  React.ComponentType<{ className?: string }>
> = {
  break: Coffee,
  food: Utensils,
  show: Theater,
  shop: ShoppingBag,
  photo: Camera,
  meet: MapPin,
  star: Sparkles,
};
