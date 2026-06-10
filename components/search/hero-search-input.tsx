'use client';
import { useReducer, useEffect, useRef } from 'react';

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
};

type TypewriterAction =
  | { type: 'start' }
  | { type: 'type_char'; char: string }
  | { type: 'delete_char' }
  | { type: 'set_phase'; phase: TypewriterPhase }
  | { type: 'next_phrase'; count: number };

const initialState: TypewriterState = {
  displayText: '',
  phraseIndex: 0,
  phase: 'typing',
  started: false,
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
  const { displayText, phraseIndex, phase, started } = state;

  useEffect(() => {
    let idleId: number | undefined;
    let delayId: ReturnType<typeof setTimeout> | undefined;

    // Start 2s after the page has loaded (and the main thread is idle), so the
    // typewriter (which re-renders the placeholder every ~150ms) never competes
    // with the critical render (LCP / hydration) on slow connections.
    const begin = () => {
      delayId = setTimeout(() => {
        const ric = window.requestIdleCallback;
        if (ric) {
          idleId = ric(() => dispatch({ type: 'start' }), { timeout: 1000 });
        } else {
          dispatch({ type: 'start' });
        }
      }, 2000);
    };

    if (document.readyState === 'complete') {
      begin();
    } else {
      window.addEventListener('load', begin, { once: true });
    }

    return () => {
      window.removeEventListener('load', begin);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (delayId !== undefined) clearTimeout(delayId);
    };
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

  return { displayText, phase, started };
}

/**
 * Leaf component owning the typewriter state, so the frequent typing ticks only
 * re-render this span — not the whole SearchCommand tree it is passed into.
 * The cursor blinks via CSS animation instead of a 530ms JS interval.
 */
function TypewriterPlaceholder({
  fallback,
  textRef,
}: {
  fallback: string;
  textRef: React.MutableRefObject<string>;
}) {
  const { displayText, phase, started } = useTypewriter(PLACEHOLDERS);

  useEffect(() => {
    textRef.current = started ? displayText : '';
  }, [textRef, started, displayText]);

  if (!started) return <>{fallback}</>;

  const showCursor = phase !== 'pausing_deleted';

  // Between phrases (text deleted, cursor hidden) show the static placeholder
  // instead of an empty field — matches the old `typedText || fallback` behavior.
  if (!displayText && !showCursor) return <>{fallback}</>;

  return (
    <>
      {displayText}
      {showCursor && (
        <span aria-hidden className="animate-[typewriter-blink_1.06s_step-end_infinite]">
          |
        </span>
      )}
    </>
  );
}

export function HeroSearchInput({
  placeholder: defaultPlaceholder,
  className,
}: HeroSearchInputProps) {
  // Mirrors the currently typed placeholder for analytics without re-rendering this parent.
  const typedTextRef = useRef('');

  const handleClick = () => {
    trackHeroSearchClicked({ placeholderShown: typedTextRef.current || 'default' });
  };

  return (
    <div
      className={`mx-auto w-full ${className ?? 'mt-4 max-w-2xl sm:mt-6 lg:mt-0'}`}
      onClick={handleClick}
    >
      <SearchCommand
        trigger="input"
        size="lg"
        placeholder={<TypewriterPlaceholder fallback={defaultPlaceholder} textRef={typedTextRef} />}
        autoFocusOnType={true}
        searchOpenSource="hero"
      />
    </div>
  );
}
