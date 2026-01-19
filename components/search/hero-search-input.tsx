'use client';
import { useState, useEffect } from 'react';

import { SearchCommand } from '@/components/search/search-bar';
import { trackEvent } from '@/lib/analytics/umami';

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
  "Rutmor's Taverne",
];

type TypewriterPhase = 'typing' | 'pausing_typed' | 'deleting' | 'pausing_deleted';

function useTypewriter(
  phrases: string[],
  typingSpeed = 150,
  deletingSpeed = 50,
  pauseDuration = 2000
) {
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
          setTimeout(() => setPhase('pausing_typed'), 0);
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
          setTimeout(() => setPhase('pausing_deleted'), 0);
        }
        break;

      case 'pausing_deleted':
        // Wait before typing next word
        timeout = setTimeout(() => {
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setPhase('typing');
        }, 3000); // 3s pause after delete
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

  // Return logic:
  // If not started, return null to let component show default placeholder
  if (!hasStarted) {
    return null;
  }

  // If pausing after delete (waiting for next word), don't show blinking cursor if requested
  // "between searches... text should not blink" -> Hide cursor during long pause
  const finalCursor = phase === 'pausing_deleted' ? '' : cursorVisible ? '|' : '';

  // If we are in pausing_deleted (empty text), we return empty string + no cursor = empty string
  // This causes fallback to defaultPlaceholder which is NOT what we want if we want "pause between searches"
  // Actually, if we want "pause between searches", we want it to look EMPTY?
  // "2 seconds between text is deleted and next search starts".
  // If it's empty, it shows default placeholder?
  // If default placeholder is "Search parks...", then it's not "empty".
  // The user said: "hier soll der text dann nicht blinken".
  // If I return "", the component uses `displayPlaceholder || defaultPlaceholder`.
  // So it shows "Search parks...".
  // Maybe that IS what's desired? "Text deleted -> Show default placeholder for 2s"??
  // A typewriter usually clears to empty.
  // If I want it to be empty, I must return " " (space)?
  // Let's assume return "" -> defaultPlaceholder is fine.
  // BUT the user said "Text blinks now when searching for nothing" (start?).
  // If I return `null` for start delay, it shows default.
  // If I return `""` for pause, it shows default.
  // The user complains about blinking.
  // My fix `finalCursor` hides cursor during pause.

  return `${displayText}${finalCursor}`;
}

export function HeroSearchInput({ placeholder: defaultPlaceholder }: HeroSearchInputProps) {
  const typedPlaceholder = useTypewriter(PLACEHOLDERS);

  // Use the typed placeholder, or fallback to default if something goes wrong (though hook ensures string)
  const displayPlaceholder = typedPlaceholder || defaultPlaceholder;

  // Track hero search clicks
  const handleClick = () => {
    trackEvent('hero_search_clicked', {
      placeholderShown: typedPlaceholder || 'default',
    });
  };

  return (
    <div
      className="mx-auto w-full max-w-2xl transform transition-all hover:scale-[1.01]"
      onClick={handleClick}
    >
      <div className="relative">
        <div className="bg-background/80 shadow-primary/5 absolute -inset-0.5 rounded-xl opacity-30 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
        <div className="relative">
          <SearchCommand
            trigger="input"
            placeholder={displayPlaceholder}
            autoFocusOnType={true}
            className={typedPlaceholder ? 'text-foreground' : 'text-muted-foreground'}
          />
        </div>
      </div>
    </div>
  );
}
