import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';

/**
 * The heading of the nearby-parks card, in every state of it (skeleton, prompt, error, empty
 * list, list), so whichever state replaces another opens with the same node.
 *
 * Under blog, news and glossary pages (`PageBottomSections`) the card is a chapter of its own and
 * opens with `ChapterHeading`, watermark variant, as the page's own chapters do on the plain
 * background. On the homepage it is `nested`: the stop around it (`NearbyChapter`) carries the
 * `<h2>`, so a title here would say the same twice, and only the hint is drawn, as a line of its
 * own over the parks.
 */
export function NearbyHeading({
  nested = false,
  title,
  hint,
}: {
  nested?: boolean;
  title: ReactNode;
  hint?: ReactNode;
}) {
  if (!nested) return <ChapterHeading icon={MapPin} title={title} hint={hint} />;
  return hint ? <p className="text-muted-foreground mb-4 text-sm">{hint}</p> : null;
}
