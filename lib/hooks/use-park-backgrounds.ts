import { useQuery } from '@tanstack/react-query';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * Client-side park/attraction background-image resolution.
 *
 * `getParkBackgroundImage` (server) probes the filesystem, which the client can't do — but
 * `/api/parks/backgrounds` returns the full list of available image paths. This hook fetches that
 * list once (images only change on deploy, so it's cached for the session) so client-rendered cards
 * (e.g. the homepage live global-stats highlights) can resolve the same background image the server
 * would, via {@link resolveParkBg} / {@link resolveAttractionBg}.
 */
export function useParkBackgrounds() {
  const { data } = useQuery<Set<string>>({
    queryKey: ['park-backgrounds'],
    queryFn: async () => {
      const res = await fetch('/api/parks/backgrounds');
      if (!res.ok) throw new Error(`Failed to fetch park backgrounds: ${res.statusText}`);
      const json = (await res.json()) as { backgrounds?: string[] };
      return new Set(json.backgrounds ?? []);
    },
    enabled: typeof window !== 'undefined',
    staleTime: Infinity, // images change only on deploy
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  return data;
}

/** Mirror of the server `getParkBackgroundImage`: `/images/parks/<slug>/background.<ext>`. */
export function resolveParkBg(slug: string, set: Set<string> | undefined): string | null {
  if (!set) return null;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const p = `/images/parks/${slug}/background${ext}`;
    if (set.has(p)) return p;
  }
  return null;
}

/** Mirror of the server `getAttractionBackgroundImage` (with park-background fallback). */
export function resolveAttractionBg(
  parkSlug: string,
  attractionSlug: string,
  set: Set<string> | undefined
): string | null {
  if (!set) return null;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const p = `/images/parks/${parkSlug}/${attractionSlug}${ext}`;
    if (set.has(p)) return p;
  }
  for (const ext of SUPPORTED_EXTENSIONS) {
    const p = `/images/parks/${parkSlug}/attractions/${attractionSlug}${ext}`;
    if (set.has(p)) return p;
  }
  return resolveParkBg(parkSlug, set);
}
