/**
 * The content registry. One per thread; both sides register the same manifests so the worker
 * and the renderer answer "what is core-classic:carousel" identically.
 */

import { parsePack, type PackManifest } from './pack-schema';

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

  /** Localised name with `en` fallback. */
  static name(names: Record<string, string>, locale: string): string {
    return names[locale] ?? names.en ?? Object.values(names)[0] ?? '';
  }
}
