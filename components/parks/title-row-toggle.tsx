'use client';

import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** The tint of a {@link TitleRowToggle}: the warning's own colours. */
export interface TitleRowToggleTone {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
}

/**
 * A weather warning as one line in the park header's „Heute im Park" row, where the weather reading
 * otherwise sits; a press opens the full warning under the row. `-my-[3px]` hands back the pill's
 * 6 px of padding and border, so it is exactly as tall as the row's own content and cannot move the
 * card when the warning lands. Shared by the rain nowcast (`NowcastAlertToggle`) and the minor
 * official warnings (`MinorWarningToggle`).
 */
export function TitleRowToggle({
  icon: Icon,
  tone,
  label,
  title,
  expanded,
  onToggle,
  controls,
  className,
}: {
  icon: LucideIcon;
  tone: TitleRowToggleTone;
  label: React.ReactNode;
  /** The whole text, for a label the row cuts short. */
  title?: string;
  expanded: boolean;
  onToggle: () => void;
  /** Id of the panel the toggle opens. */
  controls: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      title={title}
      className={cn(
        'relative -my-[3px] flex max-w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-full border py-0.5 pr-1.5 pl-2 text-sm font-medium transition-colors',
        tone.border,
        tone.bg,
        tone.text,
        'focus-visible:ring-primary hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none',
        className
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', tone.iconColor)} aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 shrink-0 opacity-70 transition-transform',
          expanded && 'rotate-180'
        )}
        aria-hidden="true"
      />
    </button>
  );
}
