import { Camera, Coffee, MapPin, ShoppingBag, Sparkles, Theater, Utensils } from 'lucide-react';
import type { PlannerBlockIcon } from '@/lib/planner/types';

/**
 * The icons a free block may carry.
 *
 * A closed set, mapped in ONE place, because the plan stores the key and not the
 * component — `localStorage` is a plan's only copy, and a stored class name or
 * an imported symbol would break the day this file is refactored. `store.ts`
 * validates the key against `PLANNER_BLOCK_ICONS` on the way in and falls back
 * rather than dropping the block, so an icon this map does not know still leaves
 * the visitor their label.
 *
 * `Theater` is deliberately the same mark the show band and the show lines use:
 * a block somebody adds for a show should look like the shows already on the
 * grid, not like a second vocabulary for one subject.
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
