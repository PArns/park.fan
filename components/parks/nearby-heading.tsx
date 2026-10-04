import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';
import { GlassSectionTitle } from '@/components/parks/glass-section-title';

/**
 * The heading of the nearby-parks card, in every state of it (skeleton, prompt, error, empty
 * list, list), so whichever state replaces another opens with the same node.
 *
 * Under blog, news and glossary pages (`PageBottomSections`) the card is a chapter of its own and
 * opens with `ChapterHeading`, watermark variant, as the page's own chapters do on the plain
 * background. On the homepage it is `nested`: `NearbyChapter` already opens the chapter with a
 * `tile` heading, so the card keeps its `GlassSectionTitle` pill there, as an `<h3>` under that
 * chapter's `<h2>`, and the hint stays a line of its own under the pill.
 */
export function NearbyHeading({
  nested = false,
  title,
  hint,
  iconClassName,
}: {
  nested?: boolean;
  title: ReactNode;
  hint?: ReactNode;
  /** The pill's icon tint. The watermark keeps ChapterHeading's own `/25`. */
  iconClassName: string;
}) {
  if (!nested) return <ChapterHeading icon={MapPin} title={title} hint={hint} />;
  return (
    <>
      <GlassSectionTitle as="h3" icon={MapPin} iconClassName={iconClassName}>
        {title}
      </GlassSectionTitle>
      {hint && <p className="text-muted-foreground mb-8 text-sm">{hint}</p>}
    </>
  );
}
