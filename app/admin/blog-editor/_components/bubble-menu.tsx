'use client';

import { Fragment } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { INLINE_MARKS } from '../_lib/inline-marks';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

/**
 * Selection-floating toolbar — bold, italic, strike, code, link.
 *
 * Strictly text-formatting only. Ref chip / link / widget editing all live
 * in the right-hand PropertiesPanel now, so this menu doesn't try to render
 * a parallel variant editor anymore (which used the old stale-position apply
 * path and would drift onto the wrong link).
 */
export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => {
        const { from, to } = state.selection;
        if (from === to) return false;
        if (e.isActive('codeBlock')) return false;
        return true;
      }}
      options={{ placement: 'top', offset: 8 }}
    >
      {/* z-40 keeps the menu above the sticky FixedToolbar (z-30). */}
      <div className="border-border/60 bg-popover text-popover-foreground relative z-40 inline-flex items-center gap-0.5 rounded-xl border p-1 shadow-xl">
        {INLINE_MARKS.map(({ mark, label, icon: Icon, apply }) => (
          <Fragment key={mark}>
            {mark === 'link' && <div className="bg-border/60 mx-1 h-5 w-px" />}
            <Btn active={editor.isActive(mark)} onClick={() => apply(editor)} label={label}>
              <Icon className="h-3.5 w-3.5" />
            </Btn>
          </Fragment>
        ))}
      </div>
    </BubbleMenu>
  );
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active ? 'bg-primary/15 text-primary' : 'hover:bg-accent/50 text-foreground/80'
      )}
    >
      {children}
    </button>
  );
}
