'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ModelCellState, ModelComparisonReport } from '@/lib/api/admin-model-comparison';
import {
  CELL_STATE_META,
  CELL_STATE_ORDER,
  inAppModelIds,
  liveProgress,
  matrixBlocks,
  type MatrixBlock,
} from '@/lib/admin/model-comparison';
import { Segmented } from '../../../_ui/controls';
import type { OpenCell } from './decision-cards';
import { StateDot } from './state-dot';

/** The phone row's chip order: what the app shows, then better, pending, worse, unclear. */
const CHIP_ORDER: Record<ModelCellState, string> = {
  today: '@max-[760px]:-order-5',
  better: '@max-[760px]:-order-4',
  pending: '@max-[760px]:-order-3',
  worse: '@max-[760px]:-order-2',
  unclear: '@max-[760px]:-order-1',
};

const TALLY_ORDER: ModelCellState[] = ['better', 'pending', 'worse'];

type Selected = { question: string; model: string } | null;

/**
 * The matrix in blocks (live and today, planner, calendar), each with only the models that answer
 * one of its questions, under their family headers with what the app shows on the left. Below
 * 760 px of panel width a row becomes labelled chips. A click opens the cell in the inspector.
 */
export function ModelMatrix({
  report,
  selected,
  onOpen,
}: {
  report: ModelComparisonReport;
  selected: Selected;
  onOpen: OpenCell;
}) {
  const [view, setView] = useState<'dim' | 'all'>('dim');
  const dimmed = view === 'dim';
  const inApp = inAppModelIds(report);

  return (
    <div className="@container">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.06] px-4 py-2.5">
        <Segmented
          label="Unklare Kreise"
          value={view}
          onChange={setView}
          options={[
            { value: 'dim', label: 'Unklare abblenden' },
            { value: 'all', label: 'Alle gleich zeigen' },
          ]}
        />
        <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {CELL_STATE_ORDER.map((state) => (
            <li key={state} className="inline-flex items-center gap-1.5">
              <StateDot state={state} size="sm" />
              {CELL_STATE_META[state].short}
            </li>
          ))}
        </ul>
      </div>
      {matrixBlocks(report).map((block) => (
        <Block
          key={block.id}
          block={block}
          inApp={inApp}
          dimmed={dimmed}
          rule={report.rule}
          selected={selected}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

function Block({
  block,
  inApp,
  dimmed,
  rule,
  selected,
  onOpen,
}: {
  block: MatrixBlock;
  inApp: Set<string>;
  dimmed: boolean;
  rule: ModelComparisonReport['rule'];
  selected: Selected;
  onOpen: OpenCell;
}) {
  const grid = {
    gridTemplateColumns: `minmax(12rem, 1fr) repeat(${block.columns.length}, minmax(56px, 84px))`,
  };
  const startsFamily = new Set(
    block.families.length === 0
      ? []
      : block.columns
          .filter((model, i) => i > 0 && model.family !== block.columns[i - 1].family)
          .map((model) => model.id)
  );
  const tally = block.sections
    .flatMap((section) => section.questions)
    .flatMap((question) => Object.values(question.cells).map((cell) => cell.state))
    .filter((state) => TALLY_ORDER.includes(state))
    .sort((a, b) => TALLY_ORDER.indexOf(a) - TALLY_ORDER.indexOf(b));
  const columnClass = (id: string) =>
    cn(
      startsFamily.has(id) && 'border-l border-white/[0.06]',
      inApp.has(id) && 'bg-white/[0.03]',
      '@max-[760px]:border-0 @max-[760px]:bg-transparent'
    );

  return (
    <div className="border-t border-white/[0.06]">
      <div className="flex flex-wrap items-center gap-2.5 bg-white/[0.025] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold">{block.label}</h3>
        <span className="inline-flex flex-wrap gap-0.5" aria-hidden="true">
          {tally.map((state, i) => (
            <StateDot key={i} state={state} size="sm" />
          ))}
        </span>
      </div>

      {block.families.length > 0 && (
        <div className="grid items-end pt-2.5 @max-[760px]:hidden" style={grid} aria-hidden="true">
          <span />
          {block.families.map((run, i) => (
            <span
              key={i}
              style={{ gridColumn: `span ${run.span}` }}
              className={cn(
                'mx-1.5 flex min-h-9 items-end justify-center border-b border-white/[0.14] px-1.5 pb-1 text-center text-[11px] leading-tight text-balance',
                run.id === 'in_app' ? 'text-foreground font-semibold' : 'text-muted-foreground'
              )}
            >
              {run.label}
            </span>
          ))}
        </div>
      )}
      <div className="grid items-end @max-[760px]:hidden" style={grid} aria-hidden="true">
        <span />
        {block.columns.map((model) => (
          <span
            key={model.id}
            className="text-muted-foreground px-1 pt-2.5 pb-2 text-center text-[11px] leading-tight font-medium text-balance"
          >
            {model.label}
          </span>
        ))}
      </div>

      {block.sections.map((section) => (
        <div key={section.id}>
          {block.sections.length > 1 && (
            <p className="text-muted-foreground border-t border-white/[0.06] px-4 pt-2 pb-1.5 text-xs font-medium">
              {section.label}
            </p>
          )}
          {section.questions.map((question) => (
            <div
              key={question.id}
              style={grid}
              className="grid items-stretch border-t border-white/[0.06] @max-[760px]:flex @max-[760px]:flex-wrap @max-[760px]:gap-1.5 @max-[760px]:px-4 @max-[760px]:pt-2.5 @max-[760px]:pb-3"
            >
              <div className="min-w-0 self-center px-4 py-2.5 @max-[760px]:-order-10 @max-[760px]:basis-full @max-[760px]:p-0 @max-[760px]:pb-1">
                <span className="block font-medium">{question.label}</span>
                <span className="text-muted-foreground block text-xs">{question.sub}</span>
                {question.leadLabel && (
                  <span className="text-primary-ink mt-0.5 block text-[11px]">
                    {question.leadLabel}
                  </span>
                )}
              </div>
              {block.columns.map((model) => {
                const cell = question.cells[model.id];
                if (!cell) {
                  return (
                    <span
                      key={model.id}
                      aria-hidden="true"
                      className={cn(
                        'grid min-h-14 place-items-center @max-[760px]:hidden',
                        columnClass(model.id)
                      )}
                    >
                      <i className="h-1 w-1 rounded-full bg-white/[0.14]" />
                    </span>
                  );
                }
                const isSelected =
                  selected?.question === question.id && selected.model === model.id;
                const quiet = dimmed && cell.state === 'unclear';
                return (
                  <span
                    key={model.id}
                    className={cn(
                      'grid min-h-14 place-items-center @max-[760px]:contents',
                      columnClass(model.id)
                    )}
                  >
                    <button
                      type="button"
                      aria-label={`${model.label}, ${question.label}: ${CELL_STATE_META[cell.state].label}`}
                      aria-current={isSelected || undefined}
                      onClick={(event) =>
                        onOpen({ question, modelId: model.id, cell }, event.currentTarget)
                      }
                      className={cn(
                        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full transition-opacity',
                        '@max-[760px]:min-h-9 @max-[760px]:min-w-0 @max-[760px]:justify-start @max-[760px]:border @max-[760px]:border-white/[0.07] @max-[760px]:bg-white/[0.025] @max-[760px]:py-[3px] @max-[760px]:pr-2.5 @max-[760px]:pl-1 @max-[760px]:text-xs',
                        CHIP_ORDER[cell.state],
                        quiet &&
                          'opacity-35 hover:opacity-100 focus-visible:opacity-100 @max-[760px]:hidden'
                      )}
                    >
                      <StateDot
                        state={cell.state}
                        progress={liveProgress(cell, rule)}
                        selected={isSelected}
                      />
                      <span className="hidden @max-[760px]:inline">{model.label}</span>
                    </button>
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
