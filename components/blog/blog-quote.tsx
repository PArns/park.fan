import { Children, isValidElement, type ReactNode } from 'react';
import { Languages, Quote } from 'lucide-react';
import { BlogQuoteOriginal } from './blog-quote-original';

interface BlogQuoteProps {
  children: ReactNode;
  /** "Original auf Englisch" for a language code, from the page's own messages. */
  originalLabel: (lang: string) => string;
}

/**
 * Somebody else's words in a post, with who said them and where: the
 * `> [!QUOTE]` callout (see `lib/blog/remark-callouts.ts`).
 *
 * remark-callouts renames the callout's last paragraph to `<figcaption>` and
 * turns an `[en] …` paragraph into `<div data-quote-original="en">`, so
 * `children` arrives as the quoted paragraphs, at most one figcaption and the
 * original's paragraphs, if the quote was translated. The figcaption is lifted
 * out of the `<blockquote>` and set under it inside a `<figure>`, which is
 * where HTML wants a quotation's source. The original is shown on hover and on
 * tap (`BlogQuoteOriginal`), with a copy for screen readers.
 *
 * The source line is written by the author in the post's language; the only
 * string of our own is the label on the original.
 */
export function BlogQuote({ children, originalLabel }: BlogQuoteProps) {
  const body: ReactNode[] = [];
  const original: ReactNode[] = [];
  let lang: string | null = null;
  let source: ReactNode = null;
  for (const child of Children.toArray(children)) {
    if (typeof child === 'string' && child.trim() === '') continue;
    if (isValidElement(child) && child.type === 'figcaption') {
      source = (child.props as { children?: ReactNode }).children;
      continue;
    }
    const originalLang =
      isValidElement(child) &&
      (child.props as { 'data-quote-original'?: string })['data-quote-original'];
    if (originalLang) {
      lang ??= originalLang;
      original.push(
        <p key={original.length}>{(child.props as { children?: ReactNode }).children}</p>
      );
      continue;
    }
    body.push(child);
  }

  const words = (
    <blockquote className="text-foreground text-[1.05rem] leading-relaxed font-medium sm:text-lg [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
      {body}
    </blockquote>
  );
  const label = lang ? originalLabel(lang) : null;

  return (
    <figure
      data-callout="quote"
      className="not-prose border-primary/25 bg-primary/5 clear-both my-8 rounded-xl border px-5 py-4 sm:px-6 sm:py-5"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <Quote className="text-primary/70 h-6 w-6" aria-hidden="true" />
        {lang && (
          // A hint that there is an original, not a control: the whole quote is the trigger.
          <span
            aria-hidden="true"
            className="text-muted-foreground border-border inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wider uppercase"
          >
            <Languages className="h-3 w-3" />
            {lang}
          </span>
        )}
      </div>
      {lang && label ? (
        <BlogQuoteOriginal lang={lang} label={label} original={original}>
          {words}
        </BlogQuoteOriginal>
      ) : (
        words
      )}
      {lang && label && (
        <div className="sr-only" lang={lang}>
          {label}: {original}
        </div>
      )}
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
