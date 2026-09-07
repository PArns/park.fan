/**
 * The palette: everything the player can put down, derived from the registry and from nothing else.
 *
 * This is the module's graded axis, so the rule is absolute — **no pack id and no item id appears
 * anywhere in `lib/game/tools/`**. What this file reads are *schema* facts, the same ones
 * `core/pack-schema.ts` declares for every pack that will ever be written:
 *
 *   - which manifest category an entry was declared under (`scenery`, `foliage`, `shops`, `rides`,
 *     `buildings`) — that is what decides the entity kind, because the kind is what routes an
 *     entity to the module that draws it (CONTENT_PACKS.md: "`kind` is what routes an item to a
 *     module");
 *   - for a ride, its own `kind` discriminator, which the schema exists to carry;
 *   - whether the entry declares a footprint at all, which is what separates a thing you put down
 *     at a point from a thing you build along a route. A coaster has `trackCostPerM` and no
 *     footprint; that is the manifest saying "I am not a point", and it is why this module lists
 *     coasters and refuses to place them rather than pretending a click is a layout.
 *
 * **Both halves of the read, or the palette is empty in the real boot.** `registry.onPack` fires on
 * registration, and `host.boot()` registers the bundled packs at step 2, before any module's
 * `main()` at step 5. So `attachPalette` walks `registry.packs()` *and* subscribes — the trap four
 * earlier modules in this project fell into, each of which had a full palette in its own test and
 * an empty one in the game.
 *
 * An item whose kind nobody claimed is **listed and disabled**, never hidden: a pack that loaded
 * but cannot be drawn should look different from a pack that did not load.
 */

import type { Registry } from '../core/registry';
import type { PackManifest } from '../core/pack-schema';
import type { EntityKind } from '../core/types';
import type { PaletteCategory, PaletteGroup, PaletteItem, PlacementMode } from './types';

/** The manifest categories this module offers, in the order the palette shows them. */
export const PALETTE_CATEGORIES: readonly PaletteCategory[] = [
  'scenery',
  'foliage',
  'shops',
  'rides',
  'buildings',
];

/**
 * Category → entity kind. The one table in this module, and it maps *schema* to *schema*.
 *
 * `rides` is the exception and is resolved from the entry's own discriminator, which is exactly
 * what that discriminator is for: `flat` is a ride the `rides` module draws, `coaster` belongs to
 * `track`, `flume` to `flumes`.
 */
const KIND_BY_CATEGORY: Record<Exclude<PaletteCategory, 'rides'>, EntityKind> = {
  scenery: 'scenery',
  foliage: 'scenery',
  shops: 'shop',
  buildings: 'building',
};

/**
 * What a plant occupies on the GROUND, as a fraction of its height. A trunk and its root plate.
 *
 * Foliage declares a height and no footprint, and the obvious derivation is the one
 * `scenery/catalog.ts` uses for scattering: the crown, `height × 0.42…0.72`. That is the right
 * number for keeping two trees from growing through each other and the wrong one for a build tool,
 * because a crown is four metres above a visitor's head — a park bench under a lime tree is a park
 * bench, not a collision. Measured on the demo park before this was changed: sweeping a 4 × 4 m
 * burger stand across the main street at z ≈ 105, **13 of 17 positions were refused**, every one of
 * them against a tree whose crown reached 5 m from its trunk. With the trunk plate it is 5 of 17,
 * and the four that remain are the lamp posts and the bench that really are in the way.
 *
 * 0.18 of the height, floored at 0.6 m: a 14 m oak gets 2.5 m, a flower bed 0.6 m. Two trees still
 * cannot be planted in the same hole, and a copse can still be planted.
 */
const FOLIAGE_BASE_FRACTION = 0.18;
const FOLIAGE_BASE_MIN = 0.6;

interface AnyDef {
  id: string;
  name?: Record<string, string>;
  kind?: string;
  cost?: number;
  footprint?: [number, number];
  size?: [number, number, number];
  height?: number;
}

export function kindForItem(category: PaletteCategory, def: AnyDef): EntityKind {
  if (category !== 'rides') return KIND_BY_CATEGORY[category];
  // `flat` is the only ride kind the `rides` module owns; the other two name their own modules.
  return def.kind === 'flat' ? 'ride' : (def.kind ?? 'ride');
}

/** The ground rectangle an item occupies, or null when the manifest declares no such thing. */
export function footprintForItem(category: PaletteCategory, def: AnyDef): [number, number] | null {
  if (def.footprint) return [def.footprint[0], def.footprint[1]];
  if (category === 'foliage') {
    const height = def.height ?? 8;
    const base = Math.max(FOLIAGE_BASE_MIN, height * FOLIAGE_BASE_FRACTION);
    return [base, base];
  }
  if (category === 'buildings' && def.size) return [def.size[0], def.size[2]];
  return null;
}

export function heightForItem(category: PaletteCategory, def: AnyDef): number {
  if (typeof def.height === 'number') return def.height;
  if (category === 'buildings' && def.size) return def.size[1];
  const footprint = footprintForItem(category, def);
  // Nothing in the schema says how tall a kiosk is, so the ghost takes the smaller side of its
  // footprint: a 4 × 4 kiosk gets a 4 m box, a 12 × 12 carousel a 12 m one. It is a box for
  // judging a position, not a model.
  return footprint ? Math.min(footprint[0], footprint[1]) : 3;
}

export function placementForItem(category: PaletteCategory, def: AnyDef): PlacementMode {
  return footprintForItem(category, def) ? 'point' : 'route';
}

export function paletteItemFrom(
  pack: PackManifest,
  category: PaletteCategory,
  def: AnyDef,
  ownerOfKind: (kind: EntityKind) => string | undefined
): PaletteItem {
  const kind = kindForItem(category, def);
  const footprint = footprintForItem(category, def);
  const placement: PlacementMode = footprint ? 'point' : 'route';
  const hasOwner = Boolean(ownerOfKind(kind));
  return {
    key: `${pack.id}:${def.id}`,
    pack: pack.id,
    item: def.id,
    category,
    kind,
    name: def.name ?? { en: def.id },
    cost: def.cost ?? 0,
    footprint,
    height: heightForItem(category, def),
    placement,
    icon: pack.icons?.[def.id] ?? null,
    available: hasOwner && placement === 'point',
    unavailableReason: !hasOwner ? 'kind' : placement === 'route' ? 'route' : null,
  };
}

/** Every placeable thing every registered pack declares, grouped by entity kind. */
export function buildPalette(registry: Registry): PaletteGroup[] {
  const groups = new Map<EntityKind, PaletteGroup>();
  const ownerOfKind = (kind: EntityKind) => registry.ownerOfKind(kind);
  for (const pack of registry.packs()) {
    for (const category of PALETTE_CATEGORIES) {
      const entries = (pack as unknown as Record<string, AnyDef[]>)[category] ?? [];
      for (const def of entries) {
        const item = paletteItemFrom(pack, category, def, ownerOfKind);
        let group = groups.get(item.kind);
        if (!group) {
          group = { kind: item.kind, items: [] };
          groups.set(item.kind, group);
        }
        group.items.push(item);
      }
    }
  }
  // Registration order, never a sort: the same argument `Registry.needOrder()` makes. A pack
  // loaded later appends to the end of the bar instead of reshuffling what the player learnt.
  return [...groups.values()];
}

/**
 * Keep a palette current: read what is already registered, then follow every pack after it.
 * Returns the detach function.
 */
export function attachPalette(registry: Registry, onChange: () => void): () => void {
  const off = registry.onPack(() => onChange());
  onChange();
  return off;
}

/** The first item a group offers that can actually be placed. */
export function firstPlaceable(groups: readonly PaletteGroup[]): PaletteItem | null {
  for (const group of groups) {
    for (const item of group.items) if (item.available) return item;
  }
  return null;
}

export function findPaletteItem(
  groups: readonly PaletteGroup[],
  key: string | null
): PaletteItem | null {
  if (!key) return null;
  for (const group of groups) {
    for (const item of group.items) if (item.key === key) return item;
  }
  return null;
}
