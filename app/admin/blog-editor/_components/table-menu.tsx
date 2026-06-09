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
  SplitSquareHorizontal,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
export function TableMenu({ editor }: TableMenuProps) {
  if (!editor) return null;
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
        <Group>
          <Btn
            onClick={() => editor.chain().focus().mergeCells().run()}
            label="Merge cells"
            disabled={!editor.can().mergeCells()}
          >
            <Combine className="h-3.5 w-3.5" />
          </Btn>
          <Btn
            onClick={() => editor.chain().focus().splitCell().run()}
            label="Split cell"
            disabled={!editor.can().splitCell()}
          >
            <SplitSquareHorizontal className="h-3.5 w-3.5" />
          </Btn>
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
