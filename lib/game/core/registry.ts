/**
 * The content registry. One per thread; both sides register the same manifests so the worker
 * and the renderer answer "what is core-classic:carousel" identically.
 */

import { PACK_CORE_KEYS, parsePack, type PackManifest } from './pack-schema';

export type ItemCategory =
  | 'needs'
  | 'themes'
  | 'materials'
  | 'scenery'
  | 'foliage'
  | 'shops'
  | 'rides'
  | 'rigs'
  | 'trackStyles'
  | 'trainStyles'
  | 'buildings'
  | 'audio'
  | 'scenarios';

export type ItemOf<C extends ItemCategory> = PackManifest[C][number];

export interface RegisteredItem<C extends ItemCategory> {
  /** `pack:id` */
  key: string;
  pack: string;
  category: C;
  def: ItemOf<C>;
}

export type ProceduralFactory = (ctx: unknown, def: unknown) => unknown;

export class Registry {
  private packList: PackManifest[] = [];
  private index = new Map<ItemCategory, Map<string, RegisteredItem<ItemCategory>>>();
  private kinds = new Map<string, string>();
  private procedurals = new Map<string, ProceduralFactory>();
  private listeners = new Set<(pack: PackManifest) => void>();
  /** Extension categories modules have claimed, by category name → owning module id. */
  private packCategories = new Map<string, string>();

  private mapFor(category: ItemCategory): Map<string, RegisteredItem<ItemCategory>> {
    let map = this.index.get(category);
    if (!map) {
      map = new Map();
      this.index.set(category, map);
    }
    return map;
  }

  registerPack(input: unknown): PackManifest {
    const manifest = parsePack(input);
    if (this.packList.some((p) => p.id === manifest.id)) {
      throw new Error(`Pack "${manifest.id}" is already registered`);
    }
    for (const req of manifest.requires) {
      if (!this.packList.some((p) => p.id === req)) {
        throw new Error(`Pack "${manifest.id}" requires "${req}", which is not registered`);
      }
    }
    this.packList.push(manifest);
    const categories: ItemCategory[] = [
      // `needs` first: a shop in the same manifest may reference one, and the cross-check below
      // reads the index this loop fills.
      'needs',
      'themes',
      'materials',
      'scenery',
      'foliage',
      'shops',
      'rides',
      'rigs',
      'trackStyles',
      'trainStyles',
      'buildings',
      'audio',
      'scenarios',
    ];
    for (const category of categories) {
      const map = this.mapFor(category);
      for (const def of manifest[category] as Array<{ id: string }>) {
        const key = `${manifest.id}:${def.id}`;
        if (map.has(key)) throw new Error(`Duplicate item ${key}`);
        map.set(key, { key, pack: manifest.id, category, def: def as never });
      }
    }
    /**
     * A shop's `need` is a string reference, not an enum (see `pack-schema.ts`), which is what
     * makes a guest need addable by manifest. The cost of that is that a typo is no longer a
     * schema error, so it becomes one here — named, with the pack and the shop that made it, and
     * checked across every registered pack because a theme pack may legitimately sell against a
     * need the base pack declared.
     */
    const knownNeeds = this.mapFor('needs');
    for (const shop of manifest.shops) {
      if (shop.need === 'none') continue;
      const local = `${manifest.id}:${shop.need}`;
      const known =
        knownNeeds.has(local) || [...knownNeeds.keys()].some((k) => k.endsWith(`:${shop.need}`));
      if (!known) {
        throw new Error(
          `Pack "${manifest.id}": shop "${shop.id}" answers need "${shop.need}", which no ` +
            `registered pack declares. Add it to this pack's "needs", or fix the id.`
        );
      }
    }

    for (const fn of this.listeners) fn(manifest);
    return manifest;
  }

  /**
   * Every registered need, in registration order.
   *
   * The order is the guest store's column order — the struct-of-arrays layout indexes needs by
   * position — so it has to be stable for a save to survive a reload. It is registration order and
   * not a sort, because a pack loaded later appends rather than reshuffling the columns a saved
   * world was written against.
   */
  needOrder(): string[] {
    return [...this.mapFor('needs').values()].map((item) => (item.def as { id: string }).id);
  }

  async loadPackFromUrl(url: string): Promise<PackManifest> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pack ${url}: HTTP ${res.status}`);
    return this.registerPack(await res.json());
  }

  onPack(fn: (pack: PackManifest) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  packs(): readonly PackManifest[] {
    return this.packList;
  }

  pack(id: string): PackManifest | undefined {
    return this.packList.find((p) => p.id === id);
  }

  items<C extends ItemCategory>(
    category: C,
    filter?: (item: RegisteredItem<C>) => boolean
  ): RegisteredItem<C>[] {
    const all = Array.from(this.mapFor(category).values()) as unknown as RegisteredItem<C>[];
    return filter ? all.filter(filter) : all;
  }

  item<C extends ItemCategory>(category: C, key: string): RegisteredItem<C> | undefined {
    return this.mapFor(category).get(key) as unknown as RegisteredItem<C> | undefined;
  }

  /** Resolve `pack` + `item` (as stored on an entity) in a category. */
  find<C extends ItemCategory>(
    category: C,
    pack: string,
    item: string
  ): RegisteredItem<C> | undefined {
    return this.item(category, `${pack}:${item}`);
  }

  theme(key: string) {
    return this.item('themes', key)?.def;
  }

  /** Declare that `owner` (a module id) handles entities of `kind`. */
  /**
   * Claim a top-level manifest key for a module.
   *
   * The counterpart to `registerKind`, and the same idea one level up: core has no list of content
   * categories and must not grow one. A module that owns `trackElements` says so here, reads the
   * key off every manifest itself, and core's only job is to notice a key that NOBODY claimed —
   * which is what turns a typo (`trackElments`) from a silent empty array into a line in the
   * console naming the pack and the key.
   *
   * It is a warning and not a throw on purpose: a pack authored against a newer build, or against
   * a module this session did not load (a showcase loads five modules, not twenty-four), has to
   * stay loadable.
   */
  registerPackCategory(category: string, owner: string): void {
    const existing = this.packCategories.get(category);
    if (existing && existing !== owner) {
      throw new Error(
        `Pack category "${category}" is already claimed by "${existing}" (now "${owner}")`
      );
    }
    this.packCategories.set(category, owner);
  }

  /** Manifest keys that are neither core's nor claimed by a module, per pack. */
  unclaimedPackKeys(): Array<{ pack: string; key: string }> {
    const out: Array<{ pack: string; key: string }> = [];
    for (const pack of this.packList) {
      for (const key of Object.keys(pack)) {
        if (PACK_CORE_KEYS.includes(key)) continue;
        if (this.packCategories.has(key)) continue;
        out.push({ pack: pack.id, key });
      }
    }
    return out;
  }

  registerKind(kind: string, owner: string): void {
    const existing = this.kinds.get(kind);
    if (existing && existing !== owner) {
      throw new Error(
        `Entity kind "${kind}" is owned by "${existing}", "${owner}" cannot claim it`
      );
    }
    this.kinds.set(kind, owner);
  }

  ownerOfKind(kind: string): string | undefined {
    return this.kinds.get(kind);
  }

  registerProcedural(name: string, factory: ProceduralFactory): void {
    this.procedurals.set(name, factory);
  }

  procedural(name: string): ProceduralFactory | undefined {
    return this.procedurals.get(name);
  }

  /**
   * Localised name with `en` fallback.
   *
   * Called `localized` and not `name`, which is what it was, because **every class in JavaScript
   * already has a `.name`** and a static member of that name replaces it. React's dev-mode
   * instrumentation reads the constructor's `.name` to label a `performance.measure` entry, got
   * this function instead of the string `"Registry"`, and `measure()` refused to structured-clone
   * it — so the page threw `could not be cloned` and then React's own `Should not already be
   * working` unwinding from inside it.
   *
   * That is worth more than a rename's worth of comment because of how it failed: whether the
   * instrumentation reached that path at all varied per load, so three of six harness runs on one
   * unchanged tree came back with two console errors and three came back clean. Zero console
   * errors is a hard gate for every module in the gauntlet, and it was passing or failing by luck
   * for all of them — including modules that never touch this file. Verifiable without a browser:
   * `node -e "import('@/lib/game/core/registry.ts').then(m => console.log(typeof m.Registry.name))"`
   * printed `function`, and prints `string` now.
   */
  static localized(names: Record<string, string>, locale: string): string {
    return names[locale] ?? names.en ?? Object.values(names)[0] ?? '';
  }
}
