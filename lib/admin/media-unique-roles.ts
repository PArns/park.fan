/**
 * Unique roles move; they are never shared.
 *
 * `ride-card` says "this is THE photo of Voltron", `park-background` says "this
 * is THE background of Europa-Park". The build has always known a second
 * claimant is a data error — `auditRoles` in the manifest generator warns — but
 * the admin let you make one: ticking `ride-card` on a new photo added the role
 * and left it on the old photo too. `getRideImage` then took whichever came
 * first, which was the old one, so the photo somebody had just chosen as the
 * ride's picture never showed up on the ride. That is how the first visitor
 * photo of Voltron stayed invisible behind the one it was meant to replace.
 *
 * So a save that claims a unique role takes it from whoever held it, in the
 * same pull request: which claims an image makes, which roles another image has
 * to give up because of them, and the rewrite of those images' sidecars. The
 * keys mirror `auditRoles` exactly, so the admin moves a role in precisely the
 * cases the build would have warned about. `pnpm test:media-unique-roles`.
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
 * The roles `other` has to give up so that `claims` stay unique.
 *
 * A role is one flag per image, not one per ride: a card that answers for two
 * rides through `alsoRides` loses `ride-card` for both when a new photo claims
 * one of them. That is the honest outcome — the old photo is no longer THE
 * picture of the first ride, and the second ride falls back to "any photo of
 * it" in `getRideImage` until somebody picks one.
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
 * Take every unique role the `claimants` claim from every other holder of it.
 *
 * `holders` maps a sidecar path to what is known about that image — the
 * manifest's row, overlaid with the session branch's version where the branch
 * has one. `skip` are the sidecars this save writes itself. The holder is
 * rewritten from `read`, which must answer with the file as it stands on the
 * branch: rebuilding it from the manifest would undo an edit made to that image
 * earlier in the same session. Only the role goes; every other field is written
 * back through the same normalizer the build uses, so the diff is one line.
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
