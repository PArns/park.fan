'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  Strikethrough,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

type RefVariant = 'info' | 'bare' | 'long' | 'full';

function parseRefHref(href: string): { value: string; opt: RefVariant | null } | null {
  if (!href.startsWith('ref:')) return null;
  const rest = href.slice(4);
  const q = rest.indexOf('?');
  if (q === -1) return { value: rest, opt: null };
  const flag = rest.slice(q + 1).split(/[&=]/)[0]?.toLowerCase() ?? '';
  const opt: RefVariant | null =
    flag === 'info' || flag === 'bare' || flag === 'long' || flag === 'full' ? flag : null;
  return { value: rest.slice(0, q), opt };
}

/**
 * Selection-floating toolbar — bold, italic, strike, code, link.
 * Mirrors Notion's shortcut: drag to select → toolbar slides in above.
 */
export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  if (!editor) return null;

  const promptForLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL (https://… / mailto:… / `ref:slug` / `ref:park/ride[?full]`)', prev ?? '');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  // Variant edit affordance — when the selection sits inside a `ref:` link the
  // bubble menu swaps to a row of variant chips so the author can switch
  // ?info/?bare/?long/?full without retyping the href.
  const linkAttrs = editor.getAttributes('link') as { href?: string };
  const refParsed = linkAttrs.href ? parseRefHref(linkAttrs.href) : null;
  const isRef = !!refParsed;
  const isRide = refParsed?.value.includes('/') ?? false;
  const currentOpt = refParsed?.opt ?? 'info';

  const setVariant = (next: RefVariant) => {
    if (!refParsed) return;
    const href = `ref:${refParsed.value}?${next}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  };
  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: e, state }) => {
        const { from, to } = state.selection;
        if (e.isActive('codeBlock')) return false;
        // Show on selection (text formatting) OR when caret sits inside a
        // ref: link so authors can change its variant in place.
        if (from === to) {
          return !!e.getAttributes('link').href?.toString().startsWith('ref:');
        }
        return true;
      }}
      options={{ placement: 'top', offset: 8 }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground inline-flex items-center gap-0.5 rounded-xl border p-1 shadow-xl">
        {isRef ? (
          <>
            <span className="text-muted-foreground px-1.5 text-[10px] font-semibold uppercase tracking-wider">
              Variant
            </span>
            {(['info', 'bare', 'long', 'full'] as const)
              .filter((v) => v !== 'long' || !isRide)
              .map((v) => (
                <Btn
                  key={v}
                  active={currentOpt === v}
                  onClick={() => setVariant(v)}
                  label={`Set ?${v}`}
                >
                  <span className="px-1 text-[10px] font-bold uppercase">{v}</span>
                </Btn>
              ))}
            <div className="bg-border/60 mx-1 h-5 w-px" />
            <Btn active={false} onClick={removeLink} label="Unlink">
              <Trash2 className="h-3.5 w-3.5" />
            </Btn>
          </>
        ) : (
          <>
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
          </>
        )}
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
