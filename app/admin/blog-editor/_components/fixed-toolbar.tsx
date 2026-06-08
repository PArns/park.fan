'use client';

import type { Editor } from '@tiptap/core';
import {
  Bold,
  ChevronDown,
  Code,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  MapPin,
  Minus,
  Quote,
  Redo2,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  TrainFront,
  Undo2,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FixedToolbarProps {
  editor: Editor | null;
  onEmit: (action: ToolbarAction) => void;
}

export type ToolbarAction =
  | 'park'
  | 'ride'
  | 'spotlight'
  | 'image'
  | 'youtube'
  | 'instagram'
  | 'suno';

const HEADINGS: Array<{ level: 1 | 2 | 3; label: string }> = [
  { level: 1, label: 'Heading 1' },
  { level: 2, label: 'Heading 2' },
  { level: 3, label: 'Heading 3' },
];

/**
 * Persistent toolbar pinned to the top of the editor canvas. Selection-aware
 * (active states reflect what's under the cursor) and offers one-click access
 * to everything the slash menu hides behind keystrokes — so authors don't have
 * to discover `/` to find an embed or a heading.
 */
export function FixedToolbar({ editor, onEmit }: FixedToolbarProps) {
  const [headingOpen, setHeadingOpen] = useState(false);
  if (!editor) return null;

  const activeHeading = HEADINGS.find((h) => editor.isActive('heading', { level: h.level }));
  const isParagraph = editor.isActive('paragraph');
  const blockLabel = activeHeading ? activeHeading.label : isParagraph ? 'Paragraph' : 'Block';

  const promptForLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt(
      'URL (https://… or ref:slug?info / ref:park/ride?full)',
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
    <div className="border-border/60 bg-background/40 -mx-8 -mt-8 mb-6 flex flex-wrap items-center gap-1 rounded-t-2xl border-b px-3 py-2">
      <Group>
        <IconBtn
          label="Undo (⌘Z)"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Redo (⌘⇧Z)"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Divider />

      <Group>
        <div className="relative">
          <button
            type="button"
            onClick={() => setHeadingOpen((v) => !v)}
            onBlur={() => setTimeout(() => setHeadingOpen(false), 150)}
            className="hover:bg-accent/40 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
          >
            {blockLabel}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {headingOpen && (
            <div className="border-border/60 bg-popover absolute left-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-lg border shadow-xl">
              <DropItem
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setHeadingOpen(false);
                }}
                active={isParagraph}
              >
                Paragraph
              </DropItem>
              {HEADINGS.map((h) => (
                <DropItem
                  key={h.level}
                  active={!!activeHeading && activeHeading.level === h.level}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: h.level }).run();
                    setHeadingOpen(false);
                  }}
                >
                  {h.label}
                </DropItem>
              ))}
            </div>
          )}
        </div>
      </Group>

      <Divider />

      <Group>
        <IconBtn
          label="Bold (⌘B)"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Italic (⌘I)"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Strikethrough"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Inline code"
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn label="Link (⌘K)" active={editor.isActive('link')} onClick={promptForLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Divider />

      <Group>
        <IconBtn
          label="Bullet list"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Numbered list"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Quote"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          label="Table"
          onClick={() =>
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
        >
          <TableIcon className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Divider />

      <Group>
        <LabelBtn label="Park" onClick={() => onEmit('park')}>
          <MapPin className="h-3.5 w-3.5" />
        </LabelBtn>
        <LabelBtn label="Ride" onClick={() => onEmit('ride')}>
          <TrainFront className="h-3.5 w-3.5" />
        </LabelBtn>
        <LabelBtn label="Spotlight" onClick={() => onEmit('spotlight')}>
          <Sparkles className="h-3.5 w-3.5" />
        </LabelBtn>
        <LabelBtn label="Image" onClick={() => onEmit('image')}>
          <ImageIcon className="h-3.5 w-3.5" />
        </LabelBtn>
        <IconBtn label="YouTube" onClick={() => onEmit('youtube')}>
          <Video className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="bg-border/40 mx-1 h-5 w-px" />;
}

function IconBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
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
        'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        active && 'bg-primary/15 text-primary',
        !active && !disabled && 'hover:bg-accent/40 text-foreground/85',
        disabled && 'text-foreground/30 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

function LabelBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={`Insert ${label}`}
      onClick={onClick}
      className="hover:bg-accent/40 text-foreground/85 inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-semibold transition-colors"
    >
      {children}
      {label}
    </button>
  );
}

function DropItem({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex w-full items-center px-3 py-1.5 text-left text-xs transition-colors',
        active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground/85'
      )}
    >
      {children}
    </button>
  );
}
