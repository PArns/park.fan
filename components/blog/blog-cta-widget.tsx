import { ExternalLink } from 'lucide-react';

import { buttonLinkProps } from '@/components/ui/button';

/** An absolute http(s) URL or a path on this site; a fence is author input like any link. */
const CTA_HREF = /^(?:https?:\/\/|\/(?!\/))/i;

/**
 * The `cta-widget` fence: one line of text and a link drawn as a button, for the single action a
 * post asks of its reader (sign a petition, book a ticket). Renders nothing without a label or with
 * an href that is neither http(s) nor a site path. Outbound targets open in a new tab like every
 * other external link in a post.
 */
export function BlogCtaWidget({
  href,
  label,
  text,
}: {
  href: string | undefined;
  label: string | undefined;
  text?: string;
}) {
  if (!href || !label || !CTA_HREF.test(href)) return null;
  const external = !href.startsWith('/');
  return (
    <aside className="not-prose border-primary/30 bg-primary/10 clear-both my-8 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      {text ? (
        <p className="text-foreground/85 m-0 text-[0.95rem] leading-relaxed">{text}</p>
      ) : null}
      <a
        href={href}
        {...(external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
        {...buttonLinkProps({
          size: 'lg',
          withIcon: external,
          // The label is the author's sentence, so on a phone it wraps inside a full-width button
          // instead of pushing the column wider than the screen.
          className:
            'max-sm:h-auto max-sm:min-h-11 max-sm:w-full max-sm:py-2.5 max-sm:text-center max-sm:whitespace-normal',
        })}
      >
        {label}
        {external ? <ExternalLink aria-hidden="true" /> : null}
      </a>
    </aside>
  );
}
