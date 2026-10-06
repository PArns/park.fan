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
 * Everything the header's "more" band draws, resolved on the server.
 *
 * The band is three hubs side by side — the dictionary, the best-travel-time page, the guide —
 * each under a photo and each with what it contains: the dictionary's categories, and the
 * chapters of the other two. The phone sheet lists the same, in the same order. Until this the
 * guide and the best-time hub were a card each with one line under it, next to a dictionary card
 * with twelve rows, so two thirds of the band were empty and the one list in it hung in the middle
 * column.
 *
 * **What it adds to the link graph is nothing, and that is why the chapters are allowed in.** Every
 * chapter is a fragment on its hub (`/beste-reisezeit#times`), which a crawler reads as the hub
 * itself — the same reasoning that let the dictionary's categories in (`glossary-menu.ts`), and the
 * opposite of the parks panel's cities, which are pages of their own and therefore stay behind a
 * fetch. The markup is the cost, measured in `docs/features/header-navigation.md`.
 *
 * **Resolved here because the header is a Client Component.** The chapter lists are six locales
 * of labels and the photos come out of `@/lib/media`, the 107 KB catalog; only the one locale's
 * labels and four URLs cross the boundary. Same reason `featured-parks-menu.ts` exists.
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
 * Which photo stands over which hub.
 *
 * **A hub gets the photo its own page opens with**, so the picture a reader clicks is the picture
 * they land on, and it is asked for the way that page asks: the guide and the best-time hub by
 * their park's `park-background` (Phantasialand's Wintertraum carousel, Efteling's Symbolica),
 * Fancast by the path its page names. The dictionary has no hero of its own — its pages draw one
 * from the rotation pool per day — so it gets Fenix, a wing coaster shot from below with the track
 * running through the frame: the biggest of its twelve categories is the coaster elements, 77
 * terms.
 *
 * Taron was tried over the guide, the ride its whole text is told at, and dropped: the 16:9 crop
 * is the station's steelwork, and at 128 px tall the banner read as a dark grey tangle.
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
