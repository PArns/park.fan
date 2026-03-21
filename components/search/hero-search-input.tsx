'use client';
import { useReducer, useEffect } from 'react';

import { SearchCommand } from '@/components/search/search-bar';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';

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

type TypewriterState = {
  displayText: string;
  phraseIndex: number;
  phase: TypewriterPhase;
  started: boolean;
  cursorVisible: boolean;
};

type TypewriterAction =
  | { type: 'start' }
  | { type: 'type_char'; char: string }
  | { type: 'delete_char' }
  | { type: 'set_phase'; phase: TypewriterPhase }
  | { type: 'next_phrase'; count: number }
  | { type: 'toggle_cursor' };

const initialState: TypewriterState = {
  displayText: '',
  phraseIndex: 0,
  phase: 'typing',
  started: false,
  cursorVisible: true,
};

function typewriterReducer(state: TypewriterState, action: TypewriterAction): TypewriterState {
  switch (action.type) {
    case 'start':
      return { ...state, started: true };
    case 'type_char':
      return { ...state, displayText: state.displayText + action.char };
    case 'delete_char':
      return { ...state, displayText: state.displayText.slice(0, -1) };
    case 'set_phase':
      return { ...state, phase: action.phase };
    case 'next_phrase':
      return {
        ...state,
        displayText: '',
        phraseIndex: (state.phraseIndex + 1) % action.count,
        phase: 'typing',
      };
    case 'toggle_cursor':
      return { ...state, cursorVisible: !state.cursorVisible };
    default:
      return state;
  }
}

function useTypewriter(
  phrases: string[],
  typingSpeed = 150,
  deletingSpeed = 50,
  pauseDuration = 2000
) {
  const [state, dispatch] = useReducer(typewriterReducer, initialState);
  const { displayText, phraseIndex, phase, started, cursorVisible } = state;

  // Initial start delay
  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: 'start' }), 3000);
    return () => clearTimeout(id);
  }, []);

  // Cursor blinking
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'toggle_cursor' }), 530);
    return () => clearInterval(id);
  }, []);

  // Main typewriter state machine
  useEffect(() => {
    if (!started) return;

    const phrase = phrases[phraseIndex];
    let id: NodeJS.Timeout;

    switch (phase) {
      case 'typing':
        if (displayText.length < phrase.length) {
          id = setTimeout(
            () => dispatch({ type: 'type_char', char: phrase[displayText.length] }),
            typingSpeed
          );
        } else {
          id = setTimeout(() => dispatch({ type: 'set_phase', phase: 'pausing_typed' }), 0);
        }
        break;
      case 'pausing_typed':
        id = setTimeout(() => dispatch({ type: 'set_phase', phase: 'deleting' }), pauseDuration);
        break;
      case 'deleting':
        if (displayText.length > 0) {
          id = setTimeout(() => dispatch({ type: 'delete_char' }), deletingSpeed);
        } else {
          id = setTimeout(() => dispatch({ type: 'set_phase', phase: 'pausing_deleted' }), 0);
        }
        break;
      case 'pausing_deleted':
        id = setTimeout(() => dispatch({ type: 'next_phrase', count: phrases.length }), 3000);
        break;
    }

    return () => clearTimeout(id);
  }, [
    started,
    displayText,
    phase,
    phraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
  ]);

  if (!started) return null;

  // Hide cursor between phrases (during pausing_deleted)
  const cursor = phase === 'pausing_deleted' ? '' : cursorVisible ? '|' : '';
  return `${displayText}${cursor}`;
}

export function HeroSearchInput({ placeholder: defaultPlaceholder }: HeroSearchInputProps) {
  const typedPlaceholder = useTypewriter(PLACEHOLDERS);

  // Use the typed placeholder, or fallback to default if something goes wrong (though hook ensures string)
  const displayPlaceholder = typedPlaceholder || defaultPlaceholder;

  const handleClick = () => {
    trackHeroSearchClicked({ placeholderShown: typedPlaceholder || 'default' });
  };

  return (
    <div
      className="group/hero mx-auto mt-4 w-full max-w-2xl cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.05] sm:mt-6 lg:mt-0"
      onClick={handleClick}
    >
      {/* Stable container to avoid CLS: min size so typewriter text changes don't resize the box */}
      <div className="relative min-h-[3.5rem] w-full">
        {/* Pulse ring – soft breathing effect */}
        <div
          className="border-primary/40 pointer-events-none absolute -inset-1 rounded-2xl border-2"
          style={{ animation: 'hero-search-pulse 2.5s ease-in-out infinite' }}
          aria-hidden="true"
        />
        {/* Prominent border; min-w-[22ch] keeps width stable when placeholder text length changes */}
        <div className="border-primary/60 group-hover/hero:border-primary group-hover/hero:shadow-primary/10 relative min-h-[3.5rem] w-full min-w-[22ch] rounded-xl border-2 shadow-md transition-[border-color,box-shadow] duration-200 group-hover/hero:shadow-lg">
          <SearchCommand
            trigger="input"
            placeholder={displayPlaceholder}
            autoFocusOnType={true}
            searchOpenSource="hero"
            className={`border-0 !shadow-none ${typedPlaceholder ? 'text-foreground' : 'text-muted-foreground'}`}
          />
        </div>
      </div>
    </div>
  );
}
