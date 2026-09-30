import { Children, isValidElement, type ReactNode } from 'react';
import { Quote } from 'lucide-react';

/**
 * Somebody else's words in a post, with who said them and where: the
 * `> [!QUOTE]` callout (see `lib/blog/remark-callouts.ts`).
 *
 * remark-callouts renames the callout's last paragraph to `<figcaption>`, so
 * `children` arrives as the quoted paragraphs plus at most one figcaption.
 * The figcaption is lifted out of the `<blockquote>` and set under it inside
 * a `<figure>`, which is where HTML wants a quotation's source.
 *
 * No label and no translated string: the quote mark and the box say what it
 * is, and the source line is written by the author in the post's language.
 */
export function BlogQuote({ children }: { children: ReactNode }) {
  const body: ReactNode[] = [];
  let source: ReactNode = null;
  for (const child of Children.toArray(children)) {
    if (typeof child === 'string' && child.trim() === '') continue;
    if (isValidElement(child) && child.type === 'figcaption') {
      source = (child.props as { children?: ReactNode }).children;
      continue;
    }
    body.push(child);
  }

  return (
    <figure
      data-callout="quote"
      className="not-prose border-primary/25 bg-primary/5 clear-both my-8 rounded-xl border px-5 py-4 sm:px-6 sm:py-5"
    >
      <Quote className="text-primary/70 mb-2 h-6 w-6" aria-hidden="true" />
      <blockquote className="text-foreground text-[1.05rem] leading-relaxed font-medium sm:text-lg [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
        {body}
      </blockquote>
      {source && (
        // The rule sits on the first line's middle, not the caption's, so a
        // source that wraps keeps it beside its first words.
        <figcaption className="text-muted-foreground mt-3 flex items-start gap-2.5 text-sm leading-snug">
          <span aria-hidden="true" className="bg-primary/50 mt-[0.65em] h-px w-5 shrink-0" />
          <span>{source}</span>
        </figcaption>
      )}
    </figure>
  );
}
