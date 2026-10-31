'use client';

import { useMemo } from 'react';
import NextLink from 'next/link';
import { useLocale } from 'next-intl';
import ReactMarkdown, { type Components } from 'react-markdown';
import { MapPin } from 'lucide-react';
import { directionsHref, safeAssistantHref } from '@/lib/assistant/links';
import { localizedPath } from '@/lib/assistant/actions';

const ALLOWED = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br'];
const LINK = 'text-primary font-medium underline underline-offset-2';

/**
 * One answer of Parky as text. The answer is model output: raw HTML is dropped, only a handful of
 * elements render, everything else is unwrapped to its text. A link is a link only to a park.fan
 * page (in the reader's language) or to Google Maps directions; anything else stays text.
 */
export function AssistantMessageText({ text }: { text: string }) {
  const locale = useLocale();
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
      p: ({ children }) => <p className="[&:not(:first-child)]:mt-2">{children}</p>,
      ul: ({ children }) => <ul className="mt-2 list-disc space-y-1 pl-5">{children}</ul>,
      ol: ({ children }) => <ol className="mt-2 list-decimal space-y-1 pl-5">{children}</ol>,
    }),
    [locale]
  );
  return (
    <ReactMarkdown skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
      {text}
    </ReactMarkdown>
  );
}
