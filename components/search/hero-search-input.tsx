'use client';
import { SearchCommand } from '@/components/search/search-bar';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';

interface HeroSearchInputProps {
  placeholder: string;
  className?: string;
}

export function HeroSearchInput({ placeholder, className }: HeroSearchInputProps) {
  return (
    <div
      className={`mx-auto w-full ${className ?? 'mt-4 max-w-2xl sm:mt-6 lg:mt-0'}`}
      onClick={() => trackHeroSearchClicked()}
    >
      <SearchCommand
        trigger="input"
        size="lg"
        placeholder={placeholder}
        autoFocusOnType={true}
        searchOpenSource="hero"
        prewarm={true}
      />
    </div>
  );
}
