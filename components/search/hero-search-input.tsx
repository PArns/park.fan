'use client';
import { useReducer, useEffect } from 'react';

import { SearchCommand } from '@/components/search/search-bar';
import { trackHeroSearchClicked } from '@/lib/analytics/umami';

interface HeroSearchInputProps {
  placeholder: string;
  className?: string;
}

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

  useEffect(() => {
    const id = setTimeout(() => dispatch({ type: 'start' }), 3000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'toggle_cursor' }), 530);
    return () => clearInterval(id);
  }, []);

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

  const cursor = phase === 'pausing_deleted' ? '' : cursorVisible ? '|' : '';
  return `${displayText}${cursor}`;
}

export function HeroSearchInput({
  placeholder: defaultPlaceholder,
  className,
}: HeroSearchInputProps) {
  const typedPlaceholder = useTypewriter(PLACEHOLDERS);
  const displayPlaceholder = typedPlaceholder || defaultPlaceholder;

  const handleClick = () => {
    trackHeroSearchClicked({ placeholderShown: typedPlaceholder || 'default' });
  };

  return (
    <div
      className={`mx-auto w-full ${className ?? 'mt-4 max-w-2xl sm:mt-6 lg:mt-0'}`}
      onClick={handleClick}
    >
      <SearchCommand
        trigger="input"
        size="lg"
        placeholder={displayPlaceholder}
        autoFocusOnType={true}
        searchOpenSource="hero"
      />
    </div>
  );
}
