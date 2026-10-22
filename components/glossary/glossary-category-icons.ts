import {
  Brain,
  CalendarCheck,
  DoorOpen,
  Factory,
  FerrisWheel,
  Hourglass,
  Infinity as InfinityIcon,
  RollerCoaster,
  ShoppingBag,
  Sparkles,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { GlossaryCategory } from '@/lib/glossary/types';

/**
 * The icon each glossary category is drawn with: the overview's chapter watermark and the term
 * page's kicker. One map, so a category looks the same wherever it appears.
 */
export const GLOSSARY_CATEGORY_ICONS: Record<GlossaryCategory, LucideIcon> = {
  'wait-times': Hourglass,
  'crowd-levels': Users,
  'park-operations': Wrench,
  planning: CalendarCheck,
  attractions: FerrisWheel,
  manufacturers: Factory,
  coasters: RollerCoaster,
  'coaster-elements': InfinityIcon,
  'ride-experience': Sparkles,
  dining: UtensilsCrossed,
  shopping: ShoppingBag,
  logistics: DoorOpen,
  ai: Brain,
};
