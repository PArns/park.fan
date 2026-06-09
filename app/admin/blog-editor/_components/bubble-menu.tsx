'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  Strikethrough,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const promptForLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(
      'URL (https://… / mailto:… / `ref:slug` / `ref:park/ride[?full]`)',
      prev ?? ''
    );
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

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
        <Btn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold (⌘B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic (⌘I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          label="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Btn>
        <Btn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          label="Inline code"
        >
          <Code className="h-3.5 w-3.5" />
        </Btn>
        <div className="bg-border/60 mx-1 h-5 w-px" />
        <Btn active={editor.isActive('link')} onClick={promptForLink} label="Link (⌘K)">
          <LinkIcon className="h-3.5 w-3.5" />
        </Btn>
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
