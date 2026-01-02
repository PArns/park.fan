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
  'Universal Studios Japan',
  'Magic Kingdom',
  'Tokyo DisneySea',
  'Efteling',
  'Cedar Point',
  'Taron',
  'Blue Fire',
  'FoodLoop',
  'Rutmor\'s Taverne',
];

type TypewriterPhase = 'typing' | 'pausing_typed' | 'deleting' | 'pausing_deleted';

function useTypewriter(phrases: string[], typingSpeed = 150, deletingSpeed = 50, pauseDuration = 2000) {
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [phase, setPhase] = useState<TypewriterPhase>('typing');
  const [hasStarted, setHasStarted] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Initial start delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      setHasStarted(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Cursor blinking
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const currentPhrase = phrases[currentPhraseIndex];
    let timeout: NodeJS.Timeout;

    switch (phase) {
      case 'typing':
        // Type one character
        if (displayText.length < currentPhrase.length) {
          timeout = setTimeout(() => {
            setDisplayText(currentPhrase.substring(0, displayText.length + 1));
          }, typingSpeed);
        } else {
          // Finished typing, switch to pause
          setPhase('pausing_typed');
        }
        break;

      case 'pausing_typed':
        // Wait before deleting
        timeout = setTimeout(() => {
          setPhase('deleting');
        }, pauseDuration);
        break;

      case 'deleting':
        // Delete one character
        if (displayText.length > 0) {
          timeout = setTimeout(() => {
            setDisplayText(currentPhrase.substring(0, displayText.length - 1));
          }, deletingSpeed);
        } else {
          // Finished deleting, switch to pause
          setPhase('pausing_deleted');
        }
        break;

      case 'pausing_deleted':
        // Wait before typing next word
        timeout = setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setPhase('typing');
        }, 2000); // 2s pause after delete
        break;
    }

    return () => clearTimeout(timeout);
  }, [
    displayText,
    phase,
    hasStarted,
    currentPhraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  return `${displayText}${cursorVisible ? '|' : ''}`;
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
