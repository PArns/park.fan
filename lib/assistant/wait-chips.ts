/**
 * A wait written in an answer, in any of the six languages: "30 Min.", "30 min", "30 minutes",
 * "30 Minuten", "30 minuti", "30 minutos". Captures the minutes.
 */
const WAIT = /(\d{1,3})\s?(?:Min\.?|min\.?|minutes?|Minuten|minuti|minutos|minuten)(?![\p{L}])/gu;

/** One piece of answer text: plain words, or a wait to draw as a chip. */
export type WaitChipPart = { text: string } | { minutes: number };

/**
 * Splits text at the waits it names, so the widget can draw each one in the site's wait chip.
 * Text without a wait comes back as one piece.
 */
export function splitWaits(text: string): WaitChipPart[] {
  const parts: WaitChipPart[] = [];
  let last = 0;
  for (const match of text.matchAll(WAIT)) {
    const minutes = Number(match[1]);
    if (minutes > 600) continue;
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ minutes });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
