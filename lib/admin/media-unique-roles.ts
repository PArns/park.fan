/**
 * Unique roles move; they are never shared. `ride-card` and `park-background` name THE photo of a
 * ride or a park, and `getRideImage` takes the first holder, so a second one would hide the photo
 * just chosen. A save that claims a unique role takes it from whoever held it, in the same pull
 * request. The keys mirror `auditRoles` in the manifest generator. `pnpm test:media-unique-roles`.
 */

import { normalizeSidecar, serializeSidecar } from '@/lib/media/sidecar.mjs';

/** The roles only one image may hold per park (`park-background`) or per ride (`ride-card`). */
export const UNIQUE_ROLES = ['park-background', 'ride-card'] as const;

export type UniqueRole = (typeof UNIQUE_ROLES)[number];

/** The fields a claim is made of — a sidecar, a manifest row, or a raw sidecar from a branch. */
export interface RoleHolder {
  park?: string | null;
  ride?: string | null;
  alsoRides?: readonly string[] | null;
  roles?: readonly string[] | null;
}

/**
 * Every uniqueness key an image claims, e.g. `ride-card:europa-park/voltron`.
 *
 * A ride card claims each ride it answers for, `alsoRides` included, because
 * `getRideImage` resolves those through the same `ride-card` preference. A role
 * without the slugs it needs claims nothing; the build warns about that one.
 */
export function uniqueClaims(image: RoleHolder): string[] {
  const roles = image.roles ?? [];
  const claims: string[] = [];
  if (roles.includes('park-background') && image.park) {
    claims.push(`park-background:${image.park}`);
  }
  if (roles.includes('ride-card') && image.park && image.ride) {
    for (const slug of [image.ride, ...(image.alsoRides ?? [])]) {
      claims.push(`ride-card:${image.park}/${slug}`);
    }
  }
  return claims;
}

/**
 * The roles `other` has to give up so that `claims` stay unique. A role is one flag per image, so
 * a card that answers for two rides through `alsoRides` loses `ride-card` for both.
 */
export function rolesToYield(claims: ReadonlySet<string>, other: RoleHolder): UniqueRole[] {
  const theirs = uniqueClaims(other);
  return UNIQUE_ROLES.filter((role) =>
    theirs.some((claim) => claim.startsWith(`${role}:`) && claims.has(claim))
  );
}

/** One role taken from one image, for the pull request's log. */
export interface Handover {
  /** The image that gave the role up, `<collection>/<name>`. */
  from: string;
  roles: UniqueRole[];
  /** The image in this save whose claim took it. */
  to: string;
}

/** `public/media/europa-park/voltron.json` → `europa-park/voltron`. */
export function idOfSidecarPath(path: string): string {
  return path.replace(/^public\/media\//, '').replace(/\.json$/, '');
}

/**
 * Takes every unique role the `claimants` claim from every other holder of it. `read` must answer
 * with the file as it stands on the session branch: rebuilding it from the manifest would undo an
 * earlier edit in the same session.
 */
export async function handOverUniqueRoles({
  claimants,
  holders,
  skip,
  read,
  write,
}: {
  claimants: ReadonlyArray<{ id: string; claims: readonly string[] }>;
  holders: ReadonlyMap<string, RoleHolder>;
  skip: ReadonlySet<string>;
  read: (path: string) => Promise<Record<string, unknown> | null>;
  write: (path: string, content: string, roles: UniqueRole[]) => Promise<void>;
}): Promise<Handover[]> {
  const claims = new Set(claimants.flatMap((c) => c.claims));
  const handovers: Handover[] = [];
  if (!claims.size) return handovers;

  for (const [path, holder] of holders) {
    if (skip.has(path)) continue;
    const yielded = rolesToYield(claims, holder);
    if (!yielded.length) continue;

    const raw = await read(path);
    if (!raw) continue;
    const before = Array.isArray(raw.roles) ? (raw.roles as string[]) : [];
    const roles = before.filter((role) => !(yielded as readonly string[]).includes(role));
    // Already given up on the branch — an earlier save in this session did it.
    if (roles.length === before.length) continue;

    const { sidecar, text } = normalizeSidecar({ ...raw, roles });
    await write(path, serializeSidecar(sidecar, text), yielded);

    // Named after the claim that took it, not the first claimant: one save can
    // carry the new card of one ride and the new background of a park.
    const to = claimants.find((c) => rolesToYield(new Set(c.claims), holder).length)!.id;
    handovers.push({ from: idOfSidecarPath(path), roles: yielded, to });
  }
  return handovers;
}
