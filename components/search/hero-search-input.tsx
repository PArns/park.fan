'use client';

import { SearchCommand } from '@/components/search/search-bar';

interface HeroSearchInputProps {
  placeholder: string;
}

/**
 * Google-style search input for the homepage hero section.
 * Displays as a clean, centered search field that triggers the search dialog on click.
 */
export function HeroSearchInput({ placeholder }: HeroSearchInputProps) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <SearchCommand trigger="input" placeholder={placeholder} />
    </div>
  );
}
