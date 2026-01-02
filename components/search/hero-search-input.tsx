'use client';
import { useState, useEffect } from 'react';

import { SearchCommand } from '@/components/search/search-bar';

interface HeroSearchInputProps {
  placeholder: string;
}

/**
 * Google-style search input for the homepage hero section.
 * Displays as a clean, centered search field that triggers the search dialog on click.
 */
const PLACEHOLDERS = [
  'Europa-Park',
  'Phantasialand',
  'Taron',
  'F.L.Y.',
  'Silver Star',
  'Winjas Fear',
  'Blue Fire',
  'Chiapas',
  'FoodLoop',
  'Rutmor\'s Taverne',
];

function useTypewriter(phrases: string[], typingSpeed = 150, deletingSpeed = 100, pauseDuration = 2000) {
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    // Determine timeout logic
    let timeout: NodeJS.Timeout;

    if (isDeleting) {
      // Deleting text
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        if (displayText.length <= 1) {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }, deletingSpeed);
    } else {
      // Typing text
      timeout = setTimeout(() => {
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        if (displayText.length === currentPhrase.length) {
          // Pause before deleting
          timeout = setTimeout(() => {
            setIsDeleting(true);
          }, pauseDuration);
        }
      }, typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

  return displayText;
}

export function HeroSearchInput({ placeholder: defaultPlaceholder }: HeroSearchInputProps) {
  const typedPlaceholder = useTypewriter(PLACEHOLDERS);

  // Use the typed placeholder, or fallback to default if something goes wrong (though hook ensures string)
  const displayPlaceholder = typedPlaceholder || defaultPlaceholder;

  return (
    <div className="mx-auto w-full max-w-2xl transform transition-all hover:scale-[1.01]">
      <div className="relative">
        <div className="bg-background/80 shadow-primary/5 absolute -inset-0.5 rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
        <div className="relative">
          <SearchCommand trigger="input" placeholder={displayPlaceholder} autoFocusOnType={true} />
        </div>
      </div>
    </div>
  );
}
