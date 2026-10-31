'use client';

import { Children, useMemo, type ReactNode } from 'react';
import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import ReactMarkdown, { type Components } from 'react-markdown';
import { MapPin } from 'lucide-react';
import { directionsHref, safeAssistantHref } from '@/lib/assistant/links';
import { localizedPath } from '@/lib/assistant/actions';
import { splitWaits } from '@/lib/assistant/wait-chips';
import { useSmoothText } from '@/lib/assistant/use-smooth-text';
import { LiveWaitPill } from '@/components/parks/live-wait-pill';

const ALLOWED = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'];
const LINK = 'text-primary font-medium underline underline-offset-2';

/** Every wait named in the text drawn as the site's wait chip, the rest left as it was. */
function withChips(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') return child;
    const parts = splitWaits(child);
    if (parts.length === 1 && 'text' in parts[0]) return child;
    return parts.map((part, index) =>
      'text' in part ? (
        part.text
      ) : (
        <LiveWaitPill
          key={index}
          minutes={part.minutes}
          className="mx-0.5 px-1.5 py-0 align-baseline text-[11px]"
        />
      )
    );
  });
}

/**
 * One answer of Parky as text. The answer is model output: raw HTML is dropped, only a handful of
 * elements render, everything else is unwrapped to its text. A link is a link only to a park.fan
 * page (in the reader's language) or to Google Maps directions; anything else stays text.
 */
export function AssistantMessageText({ text }: { text: string }) {
  const locale = useLocale();
  // Written out smoothly rather than in the stream's bursts.
  const visible = useSmoothText(text);
  const components = useMemo<Components>(
    () => ({
      a: ({ href, children }) => {
        const site = safeAssistantHref(href);
        if (site) {
          return (
            <NextLink href={localizedPath(site, locale)} className={LINK}>
              {children}
            </NextLink>
          );
        }
        const directions = directionsHref(href);
        if (directions) {
          return (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`${LINK} inline-flex items-center gap-0.5`}
            >
              <MapPin className="size-3.5" />
              {children}
            </a>
          );
        }
        return <span>{children}</span>;
      },
      p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{withChips(children)}</p>,
      li: ({ children }) => <li>{withChips(children)}</li>,
      strong: ({ children }) => <strong>{withChips(children)}</strong>,
      ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
    }),
    [locale]
  );
  return (
    <ReactMarkdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
      {visible}
    </ReactMarkdown>
  );
}
