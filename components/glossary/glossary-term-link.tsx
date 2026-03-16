'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { GLOSSARY_TERMS } from '@/lib/glossary/data';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/translations';
import type { Locale } from '@/i18n/config';

interface GlossaryTermLinkProps {
  /** Glossary term id (from data.ts). */
  termId: string;
  children: string;
  className?: string;
}

/**
 * Lightweight client component for rendering a glossary term link without tooltip.
 * Use this in client component trees where async GlossaryInject is not available.
 */
export function GlossaryTermLink({ termId, children, className }: GlossaryTermLinkProps) {
  const locale = useLocale() as Locale;
  const termData = GLOSSARY_TERMS.find((t) => t.id === termId);
  if (!termData) return <>{children}</>;
  const slug = termData.slugs[locale];
  const segment = GLOSSARY_SEGMENTS[locale];

  return (
    <Link
      href={`/${locale}/${segment}/${slug}`}
      className={
        className ??
        'border-b border-dashed border-current/40 cursor-help font-[inherit] no-underline'
      }
    >
      {children}
    </Link>
  );
}
