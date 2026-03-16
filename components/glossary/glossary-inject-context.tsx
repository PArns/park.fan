'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '@/i18n/config';

export interface GlossaryInjectTerm {
  id: string;
  name: string;
  shortDefinition: string;
  slug: string;
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
  return (
    <GlossaryInjectContext value={{ terms, locale, segment }}>
      {children}
    </GlossaryInjectContext>
  );
}

export function useGlossaryInject() {
  return useContext(GlossaryInjectContext);
}
