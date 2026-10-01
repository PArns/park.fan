'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface BlogQuoteOriginalProps {
  /** BCP 47 code of the original, e.g. `en`: set on the card so it is read and hyphenated as such. */
  lang: string;
  /** "Original auf Englisch", already translated by the server. */
  label: string;
  /** The original paragraphs, server-rendered. */
  original: ReactNode;
  /** The translated `<blockquote>`, which is the trigger. */
  children: ReactNode;
}

/**
 * The original wording of a translated quote, on hover and on tap.
 *
 * `HoverCard` opens on a mouse hover and on keyboard focus, and Radix leaves
 * touch alone on purpose, so a tap opens it here and a second tap, a tap
 * outside or Escape closes it. The second tap needs care: Radix's dismiss
 * layer counts a tap on the trigger as a tap outside the card and closes it on
 * `pointerdown`, before the `click` arrives, so the click reads whether the
 * card was open when the finger came down. A mouse click changes nothing,
 * because hovering already decided. The card sits over the text and moves
 * nothing below it.
 * Screen readers get the original from a visually hidden copy in `BlogQuote`,
 * because a hover card is not announced.
 */
export function BlogQuoteOriginal({ lang, label, original, children }: BlogQuoteOriginalProps) {
  const [open, setOpen] = useState(false);
  const openAtPointerDown = useRef(false);
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setOpen((value) => !value);
  };

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          aria-expanded={open}
          aria-label={label}
          onPointerDownCapture={() => {
            openAtPointerDown.current = open;
          }}
          onClick={(event) => {
            const pointerType = (event.nativeEvent as PointerEvent).pointerType;
            if (pointerType === 'touch' || pointerType === 'pen')
              setOpen(!openAtPointerDown.current);
          }}
          onKeyDown={onKeyDown}
          className="focus-visible:ring-ring/40 cursor-help rounded-md focus:outline-none focus-visible:ring-2"
        >
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent lang={lang} align="start" className="w-[min(30rem,calc(100vw-2rem))] p-4">
        <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          {label}
        </p>
        <div className="text-foreground text-sm leading-relaxed [&>p]:my-1.5 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          {original}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
