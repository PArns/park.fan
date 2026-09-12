/**
 * Shops: food, drink, toilets, changing rooms, first aid, cash machines, souvenirs and information
 * — the counters, the queues, the tills, and the buildings they happen in.
 *
 * Import-safe on the worker. `sim` is a plain function over pure files (`manifest`, `noise`,
 * `types`); everything that touches Babylon sits behind the dynamic imports below.
 * `ShopsMainApi` is deliberately NOT re-exported here, for the reason terrain, paths, track and
 * guests all give: a type re-export keeps a module reference to `main.ts` that a bundler is free to
 * follow into Babylon. Import it from `@/lib/game/shops/main`.
 *
 * `deps` names `paths` and not `guests`, and the omission is deliberate rather than an oversight.
 * `deps` decides creation order for the whole game as well as which modules a showcase loads, and
 * `guests` sits after `shops` in `lib/game/modules.ts` — naming it here would move a module that is
 * not this one's to move. What that costs is that `?showcase=shops` has no crowd in it; the demo
 * park is where a queue is photographed, and the report says which frames came from where.
 */

import type { GameModule } from '../core/types';
import { createShopsSim } from './sim';

export const shopsModule: GameModule = {
  id: 'shops',
  deps: ['core', 'terrain', 'paths'],
  kinds: ['shop'],
  sim: createShopsSim,
  main: async (ctx) => (await import('./main')).createShopsMain(ctx),
  showcase: async (ctx) => (await import('./showcase')).stageShopsShowcase(ctx),
};

export type {
  Cents,
  ShopEntityData,
  ShopJoin,
  ShopMenuDef,
  ShopOffer,
  ShopRefusal,
  ShopSale,
  ShopStyleDef,
  ShopView,
  ShopsSimApi,
  ShopsStats,
} from './types';
export { frontSetback } from './sim';
export {
  attachShopContent,
  boardFor,
  glyphFor,
  menuForShop,
  parseShopMenu,
  parseShopStyle,
  registerShopMenu,
  registerShopStyle,
  resetShopContent,
  resolveShop,
  shopMenus,
  shopStyle,
  shopStyles,
  styleForShop,
  SHOP_GLYPHS,
  SHOP_MENU_MANIFEST,
  SHOP_STYLE_MANIFEST,
} from './manifest';
export type { ResolvedShop, ShopItemLike } from './manifest';
