'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';

export interface GlossaryInjectTerm {
  id: string;
  name: string;
  shortDefinition: string;
  slug: string;
  /** Plural forms / alternate names that also link to this term — needed for client-side matching. */
  aliases?: string[];
}

interface GlossaryInjectContextValue {
  terms: GlossaryInjectTerm[];
  locale: Locale;
  segment: string;
}

const GlossaryInjectContext = createContext<GlossaryInjectContextValue | null>(null);

export function GlossaryInjectProvider({
  children,
  terms,
  locale,
  segment,
}: {
  children: ReactNode;
  terms: GlossaryInjectTerm[];
  locale: Locale;
  segment: string;
}) {
  // Memoized so a provider re-render doesn't hand every consumer a new context reference
  // (which would re-run their glossary term parsing for unchanged inputs).
  const value = useMemo(() => ({ terms, locale, segment }), [terms, locale, segment]);
  return <GlossaryInjectContext value={value}>{children}</GlossaryInjectContext>;
}

export function useGlossaryInject() {
  return useContext(GlossaryInjectContext);
}
