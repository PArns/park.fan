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
    <div className="mx-auto w-full max-w-2xl transform transition-all hover:scale-[1.01]">
      <div className="relative">
        <div className="bg-background/80 shadow-primary/5 absolute -inset-0.5 rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
        <div className="relative">
          <SearchCommand trigger="input" placeholder={placeholder} autoFocusOnType={true} />
        </div>
      </div>
    </div>
  );
}
