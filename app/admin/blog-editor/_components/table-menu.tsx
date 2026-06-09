'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Combine,
  Heading1,
  Heading2,
  Palette,
  SplitSquareHorizontal,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TABLE_THEMES, type TableTheme } from '../_extensions/themed-table';

interface TableMenuProps {
  editor: Editor | null;
}

/**
 * Floating table operations toolbar.
 *
 * Appears whenever the caret is inside a table cell — gives the author
 * one-click access to add / remove rows + columns, toggle header row / column
 * and delete the whole table. Keeps the FixedToolbar uncluttered (which only
 * needs the *insert* button) while still surfacing every table command the
 * @tiptap/extension-table package ships with.
 */
const THEME_LABEL: Record<TableTheme, string> = {
  default: 'Default',
  primary: 'Primary',
  accent: 'Accent',
  success: 'Success',
  warning: 'Warning',
  danger: 'Danger',
};

const THEME_SWATCH: Record<TableTheme, string> = {
  default: 'bg-foreground/15',
  primary: 'bg-primary/60',
  accent: 'bg-accent/60',
  success: 'bg-emerald-500/60',
  warning: 'bg-amber-500/60',
  danger: 'bg-rose-500/60',
};

export function TableMenu({ editor }: TableMenuProps) {
  const [themeOpen, setThemeOpen] = useState(false);
  if (!editor) return null;
  const currentTheme = (editor.getAttributes('table').theme ?? 'default') as TableTheme;
  const setTheme = (t: TableTheme) => {
    // `updateAttributes('table', …)` only touches the node at the current
    // selection — which is the table cell, not the table itself. Walk up
    // from the caret to find the enclosing table and patch its attrs.
    editor
      .chain()
      .focus()
      .command(({ tr, state }) => {
        const { $from } = state.selection;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'table') {
            tr.setNodeAttribute(depth === 0 ? 0 : $from.before(depth), 'theme', t);
            return true;
          }
        }
        return false;
      })
      .run();
    setThemeOpen(false);
  };
  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e }) => e.isActive('table')}
      options={{ placement: 'top', offset: 12 }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground inline-flex items-center gap-0.5 rounded-xl border p-1 shadow-xl">
        <Group>
          <Btn
            onClick={() => editor.chain().focus().addRowBefore().run()}
            label="Add row above"
            disabled={!editor.can().addRowBefore()}
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().addRowAfter().run()}
            label="Add row below"
            disabled={!editor.can().addRowAfter()}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().deleteRow().run()}
            label="Delete row"
            disabled={!editor.can().deleteRow()}
            destructive
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Btn>
        </Group>
        <Divider />
        <Group>
          <Btn
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            label="Add column left"
            disabled={!editor.can().addColumnBefore()}
          >
            <ArrowLeftToLine className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            label="Add column right"
            disabled={!editor.can().addColumnAfter()}
          >
            <ArrowRightToLine className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().deleteColumn().run()}
            label="Delete column"
            disabled={!editor.can().deleteColumn()}
            destructive
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Btn>
        </Group>
        <Divider />
        <Group>
          <Btn
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            label="Toggle header row"
            active={editor.isActive('tableHeader')}
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            label="Toggle header column"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Btn>
        </Group>
        <Divider />
        {/* Merge / split only make sense once the author has drag-selected
            multiple cells (mergeCells) or parked the caret inside a merged
            one (splitCell). Hide them entirely otherwise so the toolbar
            doesn't read as "lots of dead buttons". */}
        {(editor.can().mergeCells() || editor.can().splitCell()) && (
          <>
            <Group>
              {editor.can().mergeCells() && (
                <Btn
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  label="Merge cells"
                >
                  <Combine className="h-3.5 w-3.5" />
                </Btn>
              )}
              {editor.can().splitCell() && (
                <Btn
                  onClick={() => editor.chain().focus().splitCell().run()}
                  label="Split cell"
                >
                  <SplitSquareHorizontal className="h-3.5 w-3.5" />
                </Btn>
              )}
            </Group>
            <Divider />
          </>
        )}
        <Group>
          <div className="relative">
            <button
              type="button"
              title="Header color"
              aria-label="Header color"
              onClick={() => setThemeOpen((v) => !v)}
              onBlur={() => setTimeout(() => setThemeOpen(false), 150)}
              className={cn(
                'hover:bg-accent/50 text-foreground/80 inline-flex h-7 items-center gap-1 rounded-md px-1.5 transition-colors',
                currentTheme !== 'default' && 'text-primary'
              )}
            >
              <Palette className="h-3.5 w-3.5" />
              <span className={cn('h-3 w-3 rounded-full', THEME_SWATCH[currentTheme])} />
            </button>
            {themeOpen && (
              <div className="border-border/60 bg-popover absolute left-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border shadow-xl">
                {TABLE_THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setTheme(t)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                      currentTheme === t
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent/40 text-foreground/85'
                    )}
                  >
                    <span className={cn('h-3 w-3 rounded-full ring-1 ring-border/60', THEME_SWATCH[t])} />
                    {THEME_LABEL[t]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Group>
        <Divider />
        <Btn
          onClick={() => editor.chain().focus().deleteTable().run()}
          label="Delete table"
          destructive
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="ml-1 text-[10px] font-semibold">Table</span>
        </Btn>
      </div>
    </BubbleMenu>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-0.5">{children}</div>;
}
function Divider() {
  return <div className="bg-border/60 mx-1 h-5 w-px" />;
}
function Btn({
  active,
  disabled,
  destructive,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center justify-center rounded-md px-1.5 transition-colors',
        active && 'bg-primary/15 text-primary',
        destructive && !disabled && 'text-destructive hover:bg-destructive/10',
        !active && !destructive && !disabled && 'hover:bg-accent/50 text-foreground/80',
        disabled && 'cursor-not-allowed opacity-40'
      )}
    >
      {children}
    </button>
  );
}
