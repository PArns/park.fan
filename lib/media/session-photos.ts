/**
 * What the open media session already holds for one park, read off its diff. The capture
 * screen's backlog is built from `main`, so without this a ride photographed this morning (a
 * commit on the session branch) would read as missing, and its next photo would be named over
 * the first. Names are read off paths, since a collision is a question about the path; rides are
 * read out of every sidecar the session touches, never from a file name or folder. Pure;
 * `pnpm test:capture-session` pins it.
 */

const MEDIA_ROOT = 'public/media/';

/** One changed file, as `pulls.listFiles` and `repos.compareCommits` describe it. */
export interface SessionFile {
  filename: string;
  /** `added`, `modified`, `removed`, `renamed`, `copied`, `changed` or `unchanged`. */
  status: string;
  /** The unified diff, when GitHub sends one — it leaves it out for large files. */
  patch?: string;
}

/** `public/media/<collection>/<name>.<ext>`, taken apart. */
export function mediaPath(
  filename: string
): { collection: string; name: string; ext: string } | null {
  if (!filename.startsWith(MEDIA_ROOT)) return null;
  const rest = filename.slice(MEDIA_ROOT.length);
  const slash = rest.lastIndexOf('/');
  if (slash <= 0) return null;
  const file = rest.slice(slash + 1);
  const dot = file.lastIndexOf('.');
  if (dot <= 0) return null;
  return {
    collection: rest.slice(0, slash),
    name: file.slice(0, dot),
    ext: file.slice(dot + 1).toLowerCase(),
  };
}

/**
 * The files that will still be there once the session merges.
 *
 * A removed file leaves its name taken on `main` until then, which the index
 * already reports, so it adds nothing here.
 */
function present(files: readonly SessionFile[]): SessionFile[] {
  return files.filter((file) => file.status !== 'removed');
}

/** File names the session occupies in one collection — image and sidecar share one. */
export function sessionNames(files: readonly SessionFile[], collection: string): string[] {
  const names = new Set<string>();
  for (const file of present(files)) {
    const path = mediaPath(file.filename);
    if (path?.collection === collection) names.add(path.name);
  }
  return [...names];
}

/** The sidecars the session adds or changes, in any collection. */
export function sessionSidecars(files: readonly SessionFile[]): SessionFile[] {
  return present(files).filter((file) => mediaPath(file.filename)?.ext === 'json');
}

/**
 * An added file's content, rebuilt from its patch.
 *
 * For a file that did not exist before, the patch is the whole file: one hunk
 * from `-0,0`, every line prefixed with `+`. That spares one request per
 * photograph. Anything else — a changed sidecar, a patch GitHub left out, a
 * hunk that is not the whole file — answers null, and the caller reads the file
 * from the branch instead.
 */
export function sidecarFromPatch(patch: string | undefined): unknown {
  if (!patch || !patch.startsWith('@@ -0,0 ')) return null;
  const lines = patch
    .split('\n')
    .slice(1)
    .filter((line) => !line.startsWith('\\'));
  if (lines.some((line) => !line.startsWith('+'))) return null;
  try {
    return JSON.parse(lines.map((line) => line.slice(1)).join('\n'));
  } catch {
    return null;
  }
}

/**
 * The rides a set of sidecars answers for in one park: `ride` and `alsoRides`,
 * the same two fields `showsRide` reads off the index.
 */
export function ridesInSidecars(sidecars: readonly unknown[], parkSlug: string): Set<string> {
  const rides = new Set<string>();
  for (const sidecar of sidecars) {
    if (!sidecar || typeof sidecar !== 'object') continue;
    const { park, ride, alsoRides } = sidecar as Record<string, unknown>;
    if (park !== parkSlug) continue;
    if (typeof ride === 'string' && ride) rides.add(ride);
    if (Array.isArray(alsoRides)) {
      for (const slug of alsoRides) if (typeof slug === 'string' && slug) rides.add(slug);
    }
  }
  return rides;
}
