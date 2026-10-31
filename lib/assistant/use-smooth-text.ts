'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';
const noSubscription = () => () => {};
const prefersReduced = () => window.matchMedia(REDUCED).matches;
const onServer = () => false;

/**
 * `text` written out smoothly, a few characters a frame, instead of in the bursts the stream
 * delivers. The pace follows the backlog (a tenth of it a frame, at least one character), so a
 * long answer never lags far behind; with reduced motion the text appears as it arrives. Text
 * that is already there when the hook mounts (a stored chat) is shown at once.
 */
export function useSmoothText(text: string): string {
  const reduced = useSyncExternalStore(noSubscription, prefersReduced, onServer);
  const [shown, setShown] = useState(text.length);
  const shownRef = useRef(text.length);

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    const step = () => {
      const current = shownRef.current;
      if (current >= text.length) return;
      const next = current + Math.max(1, Math.ceil((text.length - current) / 10));
      shownRef.current = next;
      setShown(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [text.length, reduced]);

  return reduced ? text : text.slice(0, Math.min(shown, text.length));
}
