'use client';

import { SearchCommand } from '@/components/search/search-bar';

interface HeroSearchButtonProps {
  label: string;
}

/**
 * Client wrapper to trigger the search dialog from the hero section.
 * This is needed because the homepage is a Server Component but
 * the search dialog requires client-side state.
 */
export function HeroSearchButton({ label }: HeroSearchButtonProps) {
  return <SearchCommand trigger="hero" label={label} />;
}
