'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  minutesAgoLabel,
  problemSourceLabel,
  type HealthAreaId,
  type HealthProblem,
} from '@/lib/admin/health';
import { useMinuteNow } from '@/lib/hooks/use-minute-now';
import { formatCount } from '@/lib/admin/site-analytics';
import { SYSTEM_MONO } from '../_ui/code-block';
import { AREA_META, TONE_META } from './tone';

/** More than this and the list folds, so the figures below stay above the fold on a laptop. */
const SHOWN = 4;

const CARD_TONE: Record<HealthProblem['tone'], string> = {
  bad: 'border-red-500/25 bg-red-500/[0.06]',
  warn: 'border-amber-400/15 bg-amber-400/[0.035]',
};

const BUTTON_TONE: Record<HealthProblem['tone'], string> = {
  bad: 'border-red-400/30 text-red-200 hover:bg-red-500/15',
  warn: 'border-amber-300/25 text-amber-100 hover:bg-amber-400/10',
};

/**
 * What needs a person, faults first, one card each. Every card names its question and carries
 * the button to the page where it is answered, or asks a silent source again in place; the card
 * goes once that page's answer has cleared the source.
 */
export function ProblemList({
  problems,
  onRetry,
}: {
  problems: readonly HealthProblem[];
  onRetry: (area: HealthAreaId) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const now = useMinuteNow();
  const shown = expanded ? problems : problems.slice(0, SHOWN);
  const hidden = problems.length - shown.length;

  return (
    <div className="space-y-2">
      <ul className="space-y-2">
        {shown.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} now={now} onRetry={onRetry} />
        ))}
      </ul>
      {problems.length > SHOWN && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-1 text-[13px] transition-colors"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
          />
          {expanded ? 'Weniger zeigen' : `${formatCount(hidden)} weitere zeigen`}
        </button>
      )}
    </div>
  );
}

function ProblemCard({
  problem,
  now,
  onRetry,
}: {
  problem: HealthProblem;
  now: number | null;
  onRetry: (area: HealthAreaId) => void;
}) {
  const Icon = problem.tone === 'bad' ? TONE_META.bad.icon : AREA_META[problem.area].icon;
  const since = problem.since ? Date.parse(problem.since) : Number.NaN;
  const sinceLabel =
    now !== null && Number.isFinite(since) ? minutesAgoLabel((now - since) / 60_000) : null;
  const buttonClass = cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors max-sm:min-h-10 max-sm:w-full',
    BUTTON_TONE[problem.tone]
  );

  return (
    <li
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3.5 sm:flex-row sm:items-start sm:gap-4',
        CARD_TONE[problem.tone]
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Icon
          aria-hidden="true"
          className={cn('mt-0.5 h-[18px] w-[18px] shrink-0', TONE_META[problem.tone].text)}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug font-medium">{problem.title}</p>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            {problemSourceLabel(problem.area)}
            {sinceLabel && <> · {sinceLabel}</>}
          </p>
          <p className="text-foreground/80 mt-1.5 text-[13px] leading-relaxed">{problem.detail}</p>
          {problem.evidence && (
            <p
              className={cn(
                'text-muted-foreground mt-2 rounded-md bg-black/25 px-2 py-1 text-xs break-words',
                SYSTEM_MONO
              )}
            >
              {problem.evidence}
            </p>
          )}
        </div>
      </div>
      {problem.retry ? (
        <button
          type="button"
          onClick={() => problem.retry && onRetry(problem.retry)}
          className={buttonClass}
        >
          <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
          {problem.action}
        </button>
      ) : (
        <Link href={problem.href} className={buttonClass}>
          {problem.action}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      )}
    </li>
  );
}
