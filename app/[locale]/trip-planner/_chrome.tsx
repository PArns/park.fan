import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChapterHeading } from '@/components/common/chapter-heading';

/**
 * A chapter of the planner page's article.
 *
 * `ChapterHeading` directly rather than the guide's `SectionShell`, for one
 * reason: `SectionShell` carries its own `container mx-auto px-4`, and this page
 * already opens one — a chapter inside it would centre a second container
 * inside the first and inset every chapter by another gutter. The directory at
 * the top and the prose under it read as one document only while they share an
 * edge.
 *
 * Every chapter here renders unconditionally, which is what earns the numbers:
 * a sequence that skips because a section had no data looks like a bug rather
 * than an omission (see `ChapterHeading`'s note on `index`).
 */
export function Chapter({
  id,
  index,
  kicker,
  title,
  icon,
  children,
}: {
  id: string;
  index: string;
  kicker?: string;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <ChapterHeading
        id={`${id}-heading`}
        index={index}
        icon={icon}
        kicker={kicker}
        title={title}
        className="mb-5 pb-4"
      />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * A short aside beside the prose — the sentence a reader would otherwise have to
 * take on trust, with the figure that backs it.
 */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="border-primary/40 text-muted-foreground border-l-2 py-1 pl-4 text-sm leading-relaxed">
      {children}
    </p>
  );
}
