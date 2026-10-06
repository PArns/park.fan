import { Fragment, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';
import { GlossaryInject } from './glossary-inject';

/**
 * Renders a glossary definition paragraph with up to two layers of linking:
 *
 *  1. Inline markdown links `[label](href)` authored in the definition. External `http(s)` links
 *     open in a new tab.
 *  2. With `autoLink` (the default), the text between them goes through {@link GlossaryInject},
 *     which links the first mention of other glossary terms.
 *
 * Links are parsed first, so a term inside a markdown label is never wrapped twice. The blog's
 * `glossary-widget` passes `autoLink={false}`: the post already links terms in the prose around
 * it, and a card would otherwise link its own term to the page its button points at. `renderLink`
 * lets a caller take over an internal link, receiving the plain anchor as `fallback`; the blog
 * widget uses it for the live ride chip.
 */

export function GlossaryRichText({
  children,
  locale,
  autoLink = true,
  renderLink,
}: {
  children: string;
  locale: Locale;
  autoLink?: boolean;
  renderLink?: (link: { label: string; href: string; fallback: ReactNode }) => ReactNode;
}) {
  type Part = { text: string } | { label: string; href: string };
  const parts: Part[] = [];
  // Local regex (fresh `lastIndex`) so there's no shared mutable module state.
  const linkRe = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(children)) !== null) {
    if (m.index > last) parts.push({ text: children.slice(last, m.index) });
    parts.push({ label: m[1], href: m[2] });
    last = m.index + m[0].length;
  }
  if (last < children.length) parts.push({ text: children.slice(last) });

  return (
    <>
      {parts.map((p, i) => {
        if ('href' in p) {
          const external = /^https?:\/\//.test(p.href);
          const anchor = (
            <a
              href={p.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-primary decoration-primary/40 hover:decoration-primary font-medium underline underline-offset-2"
            >
              {p.label}
            </a>
          );
          if (external || !renderLink) return <Fragment key={i}>{anchor}</Fragment>;
          return <Fragment key={i}>{renderLink({ ...p, fallback: anchor })}</Fragment>;
        }
        if (!autoLink) return <Fragment key={i}>{p.text}</Fragment>;
        return (
          <GlossaryInject key={i} locale={locale}>
            {p.text}
          </GlossaryInject>
        );
      })}
    </>
  );
}
