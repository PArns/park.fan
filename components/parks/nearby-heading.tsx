import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';

/**
 * The heading of the nearby-parks card, in every state of it (skeleton, prompt, error, empty
 * list, list), so whichever state replaces another opens with the same node.
 *
 * Under blog, news and glossary pages (`PageBottomSections`) the card is a chapter of its own and
 * opens with `ChapterHeading`, watermark variant, as the page's own chapters do on the plain
 * background.
 */
export function NearbyHeading({ title, hint }: { title: ReactNode; hint?: ReactNode }) {
  return <ChapterHeading icon={MapPin} title={title} hint={hint} />;
}
