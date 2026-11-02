import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';

/**
 * The heading of „Beliebte Parks", which streams, and the lookup that resolves its strings. Its own
 * file so the Suspense fallback can mount the real heading, whose height moves with how title and
 * hint wrap, rather than a sized placeholder. Synchronous and taking resolved strings, because a
 * fallback that awaits suspends; the caller resolves the labels once with
 * {@link getFeaturedParksLabels} for both the boundary and the section.
 */

/** Title and intro of „Beliebte Parks" — the homepage and `PageBottomSections` both stream it. */
export interface FeaturedParksLabels {
  title: string;
  hint: string;
}

/** Resolves the title and intro of the featured parks heading for `FeaturedParksHeading`. */
export async function getFeaturedParksLabels(): Promise<FeaturedParksLabels> {
  const tHome = await getTranslations('home');
  return {
    title: tHome('sections.featuredParks'),
    hint: tHome('sections.featuredParksIntro'),
  };
}

/**
 * „Beliebte Parks", in the slot and in its fallback alike. `tile` on the homepage, where every
 * chapter opens with the plate; `watermark` (the default) under blog, news and glossary pages,
 * whose own chapters carry the watermark glyph on the plain page background. No kicker in either.
 */
export function FeaturedParksHeading({
  labels,
  variant = 'watermark',
}: {
  labels: FeaturedParksLabels;
  variant?: 'watermark' | 'tile';
}) {
  return <ChapterHeading variant={variant} icon={Star} title={labels.title} hint={labels.hint} />;
}
