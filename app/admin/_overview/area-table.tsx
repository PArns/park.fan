'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HealthArea } from '@/lib/admin/health';
import { CheckBars, CheckRing, HEALTH_FILL, HEALTH_TEXT } from '../_ui/metrics';
import { AREA_META, TONE_META } from './tone';

/** The columns from `md`: name, state, checks, key figure, one bar per check. */
const COLUMNS =
  'md:grid md:grid-cols-[minmax(0,1.4fr)_8.5rem_7rem_minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-4';

/**
 * The parts of the system as rows, each with its verdict, how many of its checks pass, the one
 * figure that matters for it and a bar per check. A row opens to list its checks with their
 * readings; on a phone each row is a block with the same facts on two lines.
 */
export function AreaTable({ areas }: { areas: readonly HealthArea[] }) {
  return (
    <div className="bg-card/70 overflow-hidden rounded-xl border border-white/[0.07]">
      <div
        aria-hidden="true"
        className={cn(
          'text-muted-foreground hidden border-b border-white/[0.06] px-4 py-2.5 text-[13px]',
          COLUMNS
        )}
      >
        <span className="pl-7">Bereich</span>
        <span>Zustand</span>
        <span>Prüfungen</span>
        <span>Kennzahl</span>
        <span>Einzeln</span>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {areas.map((area) => (
          <AreaRow key={area.id} area={area} />
        ))}
      </ul>
    </div>
  );
}

function AreaRow({ area }: { area: HealthArea }) {
  const [open, setOpen] = useState(false);
  const meta = AREA_META[area.id];
  const tone = TONE_META[area.tone];
  const passed = area.checks.filter((check) => check.tone === 'ok').length;
  const openable = area.checks.length > 0;

  return (
    <li>
      <div
        className={cn(
          'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3',
          COLUMNS
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            disabled={!openable}
            aria-expanded={open}
            aria-label={`${area.label}: Prüfungen ${open ? 'zuklappen' : 'aufklappen'}`}
            className="text-muted-foreground hover:text-foreground -ml-1 rounded-md p-1 transition-colors disabled:opacity-30"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn('h-4 w-4 transition-transform', open && 'rotate-90')}
            />
          </button>
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1',
              meta.tile
            )}
          >
            <meta.icon aria-hidden="true" className="h-4 w-4" />
          </span>
          <Link
            href={area.href}
            className="group flex min-w-0 items-center gap-1 text-[15px] font-medium"
          >
            <span className="truncate">{area.label}</span>
            <ArrowUpRight
              aria-hidden="true"
              className="text-muted-foreground h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </Link>
        </div>

        <p
          className={cn(
            'flex items-center gap-2 text-sm font-medium max-md:justify-self-end',
            tone.text
          )}
        >
          {area.pending === 'loading' ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground font-normal">fragt…</span>
            </>
          ) : area.pending === 'failed' ? (
            <>
              <tone.icon aria-hidden="true" className="h-4 w-4" />
              keine Antwort
            </>
          ) : (
            <>
              <tone.icon aria-hidden="true" className="h-4 w-4" />
              {tone.word}
            </>
          )}
        </p>

        <div className="hidden items-center gap-2 text-sm tabular-nums md:flex">
          {openable && (
            <>
              <CheckRing passed={passed} total={area.checks.length} tone={area.tone} />
              <span>
                {passed} / {area.checks.length}
              </span>
            </>
          )}
        </div>

        <p className="min-w-0 truncate text-sm tabular-nums max-md:pl-[4.25rem]">
          {area.figure ? (
            <>
              {area.figure.value} <span className="text-muted-foreground">{area.figure.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">–</span>
          )}
        </p>

        <div className="flex justify-end md:justify-start">
          <CheckBars checks={area.checks} />
        </div>
      </div>

      {open && openable && (
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1.5 border-t border-white/[0.04] bg-black/15 px-4 py-3 pl-[4.75rem] text-[13px] sm:grid-cols-2 xl:grid-cols-3">
          {area.checks.map((check) => (
            <li key={check.id} className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', HEALTH_FILL[check.tone])}
              />
              <span className="text-muted-foreground shrink-0">{check.label}</span>
              <span
                className={cn(
                  'ml-auto min-w-0 truncate text-right tabular-nums',
                  check.tone === 'ok' ? 'text-foreground/85' : HEALTH_TEXT[check.tone]
                )}
                title={check.value}
              >
                {check.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
