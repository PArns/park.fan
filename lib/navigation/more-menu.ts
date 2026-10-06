import 'server-only';
import type { Locale } from '@/i18n/config';
import { BEST_TIME_CHAPTERS } from '@/lib/best-time/chapters';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { HOWTO_CHAPTERS, type Chapter } from '@/lib/howto/chapters';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { getMediaImageBySrc, getParkBackground, getRideImage } from '@/lib/media';
import { focusToObjectPosition, variantFor, versioned } from '@/lib/media/focus';
import type { MediaImage } from '@/lib/media/types';
import { getGlossaryMenu, type GlossaryMenu } from '@/lib/navigation/glossary-menu';

/**
 * Everything the header's "more" band draws, resolved on the server: three hubs side by side (the
 * dictionary, the best-travel-time page, the guide), each under a photo and with its categories or
 * chapters. The chapters add nothing to the link graph, since a fragment on a hub
 * (`/beste-reisezeit#times`) reads as the hub itself. Resolved here because the header is a Client
 * Component and the photos come from the `@/lib/media` catalog. See
 * docs/features/header-navigation.md.
 */

/** A photo for the band, as the panel needs it: a versioned URL and, for an uncut source, where
 *  its subject is. */
export interface MoreMenuPhoto {
  src: string;
  position?: string;
}

/** A chapter of a hub, as a link: its number, its label, and the hub's path with its anchor. */
export interface MoreMenuChapter {
  index: string;
  label: string;
  href: string;
}

export interface MoreMenuHub {
  /** Locale-relative — the i18n `Link` adds the prefix. */
  href: string;
  photo: MoreMenuPhoto | null;
}

export interface MoreMenu {
  glossary: MoreMenuHub & GlossaryMenu;
  howto: MoreMenuHub & { chapters: MoreMenuChapter[] };
  bestTime: MoreMenuHub & { chapters: MoreMenuChapter[] };
  /** The forecasting model's page, drawn as a card under the best-time chapters. */
  fancast: MoreMenuHub;
}

/**
 * Which photo stands over which hub: the photo its own page opens with, asked for the way that
 * page asks, so the picture a reader clicks is the one they land on. The dictionary has no hero of
 * its own, so it gets Fenix, a coaster for its biggest category, the coaster elements.
 */
const PHOTOS = {
  glossary: () => getRideImage('attractiepark-toverland', 'fenix'),
  howto: () => getParkBackground('phantasialand'),
  bestTime: () => getParkBackground('efteling'),
  fancast: () => getMediaImageBySrc('/media/europa-park/voltron-nevera-powered-by-rimac.jpg'),
} satisfies Record<string, () => MediaImage | null>;

/** The pre-cut 16:9 crop where there is one — it was cut around the focal point already. */
function photoOf(image: MediaImage | null): MoreMenuPhoto | null {
  if (!image) return null;
  const path = variantFor(image, '16x9');
  return {
    src: versioned(path, image),
    position: path === image.src ? focusToObjectPosition(image.focus) : undefined,
  };
}

function chaptersOf(hubPath: string, chapters: Chapter[]): MoreMenuChapter[] {
  return chapters.map(({ id, index, label }) => ({ index, label, href: `${hubPath}#${id}` }));
}

type StaticPart = Omit<MoreMenu, 'glossary'> & { glossary: MoreMenuHub };

const STATIC_PART = new Map<Locale, StaticPart>();

/**
 * The part that depends on nothing but the locale — chapter lists and photos — memoised per
 * process like `getFeaturedParksMenu`: the layout asks on every page, and the answer is fixed for
 * the deployment. Callers share the object and must not mutate it.
 */
function staticPart(locale: Locale): StaticPart {
  let part = STATIC_PART.get(locale);
  if (!part) {
    const howtoPath = `/${HOWTO_SEGMENTS[locale]}`;
    const bestTimePath = `/${BEST_TIME_SEGMENTS[locale]}`;
    part = {
      glossary: { href: `/${GLOSSARY_SEGMENTS[locale]}`, photo: photoOf(PHOTOS.glossary()) },
      howto: {
        href: howtoPath,
        photo: photoOf(PHOTOS.howto()),
        chapters: chaptersOf(howtoPath, HOWTO_CHAPTERS[locale]),
      },
      bestTime: {
        href: bestTimePath,
        photo: photoOf(PHOTOS.bestTime()),
        chapters: chaptersOf(bestTimePath, BEST_TIME_CHAPTERS[locale]),
      },
      fancast: { href: '/fancast', photo: photoOf(PHOTOS.fancast()) },
    };
    STATIC_PART.set(locale, part);
  }
  return part;
}

/**
 * Builds the header's "more" band for a locale: the glossary, guide and best-time hubs with their
 * photos and chapters, plus the Fancast card.
 */
export async function getMoreMenu(locale: Locale): Promise<MoreMenu> {
  const part = staticPart(locale);
  const glossary = await getGlossaryMenu(locale);
  return { ...part, glossary: { ...part.glossary, ...glossary } };
}
