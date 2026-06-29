import type { Locale } from '@/i18n/config';
import { GlossaryInject } from './glossary-inject';

/**
 * Renders a glossary definition paragraph with two layers of linking:
 *
 *  1. Inline markdown links `[label](href)` — authored directly in the
 *     definition text (e.g. linking a ride or park to its source). External
 *     `http(s)` links open in a new tab; anything else is treated as internal.
 *  2. Everything between those links is passed through {@link GlossaryInject},
 *     which auto-links the first mention of other glossary terms.
 *
 * Links are parsed first so a term name inside a markdown label is never
 * double-wrapped. Server component (GlossaryInject is async).
 */

export function GlossaryRichText({ children, locale }: { children: string; locale: Locale }) {
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
          return (
            <a
              key={i}
              href={p.href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="text-primary decoration-primary/40 hover:decoration-primary font-medium underline underline-offset-2"
            >
              {p.label}
            </a>
          );
        }
        return (
          <GlossaryInject key={i} locale={locale}>
            {p.text}
          </GlossaryInject>
        );
      })}
    </>
  );
}
