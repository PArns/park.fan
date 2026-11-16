'use client';

import { useId, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CROWD_TEXT_CLASS } from '@/lib/utils/crowd-level-styles';
import { askParky } from '@/lib/assistant/ask';
import { useAssistantGateStatus } from '@/lib/assistant/use-assistant-gate';
import { BUBBLE, EYES } from './drawing';
import { ParkyEyeWhite, ParkyPupil } from './eyes';
import { HolidayGround } from './holiday-parky';
import { ParkyWheel } from './wheel';

/**
 * How Parky rates what the stamp sits on, and so its ink: `good` in the open-status green, `meh` in
 * the amber of a high crowd, `bad` in the red of an extreme one.
 */
export type ParkyStampTone = 'good' | 'meh' | 'bad';

const INK: Record<ParkyStampTone, string> = {
  good: 'text-status-operating',
  meh: CROWD_TEXT_CLASS.high,
  bad: CROWD_TEXT_CLASS.extreme,
};

/** `sm` for a card, `md` for a calendar day or anywhere with room. */
const SIZE = {
  sm: { label: 'px-1.5 py-[3px] text-[9px]', parky: 'w-7' },
  md: { label: 'px-2 py-1 text-[11px]', parky: 'w-9' },
} as const;

/**
 * Parky's verdict pressed onto a card like a rubber stamp: a short `label` in capitals in a double
 * ring, tilted, in the ink of its `tone`, with a tiny Parky (the live drawing's wheel, bubble and
 * eyes) peeking over its top edge at the right. It stamps down once when it first renders, and not
 * at all under reduced motion (`.parky-stamp` in `app/parky.css`).
 *
 * `label` is the caller's, already translated and short ("Walk-on!"); screen readers hear it as
 * „Parkys Urteil: …“. With a `question`, and where Parky shows for this visitor, the stamp is a
 * button that opens the chat with that question (`askParky`, source `stamp`); on a card that is a
 * link it stays its own tab stop and never follows the card's link. `className` places it.
 */
export function ParkyStamp({
  tone,
  label,
  size = 'sm',
  question,
  className,
}: {
  tone: ParkyStampTone;
  label: string;
  size?: keyof typeof SIZE;
  question?: string;
  className?: string;
}) {
  const t = useTranslations('parkyStill.stamp');
  const ground = `${useId()}ground`;
  const askable = useAssistantGateStatus() === 'on' && question !== undefined;
  const verdict = t('verdict', { label });
  const body = (
    <>
      <svg
        viewBox="3 -8.5 42 38"
        className={cn('absolute right-1 bottom-[calc(100%-2px)] h-auto', SIZE[size].parky)}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <HolidayGround id={ground} />
        </defs>
        <ParkyWheel />
        <path d={BUBBLE} fill={`url(#${ground})`} />
        {EYES.map((x) => (
          <g key={x}>
            <ParkyEyeWhite x={x} />
            <ParkyPupil x={x} dy={1.6} />
          </g>
        ))}
      </svg>
      <span className="bg-background/85 relative block rounded-md border-2 border-current p-px">
        <span
          className={cn(
            'block rounded-[3px] border border-current leading-none font-black tracking-[0.08em] whitespace-nowrap uppercase',
            SIZE[size].label
          )}
        >
          <span aria-hidden="true">{label}</span>
          {!askable && <span className="sr-only">{verdict}</span>}
        </span>
      </span>
    </>
  );
  const stamp = cn('parky-stamp relative inline-block -rotate-7 select-none', INK[tone], className);

  if (!askable) return <span className={stamp}>{body}</span>;
  const ask = (event: MouseEvent) => {
    // The stamp sits on a card that is itself a link.
    event.preventDefault();
    event.stopPropagation();
    askParky(question, 'stamp');
  };
  return (
    <button
      type="button"
      onClick={ask}
      aria-label={t('ask', { verdict })}
      className={cn(
        stamp,
        'cursor-pointer rounded-md transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none'
      )}
    >
      {body}
    </button>
  );
}
