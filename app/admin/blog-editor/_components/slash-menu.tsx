'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type CSSProperties,
} from 'react';
import {
  Camera,
  Code,
  Film,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  List,
  ListOrdered,
  MapPin,
  Minus,
  Music,
  Quote,
  Sparkles,
  Table as TableIcon,
  TrainFront,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WIDGETS } from '../_lib/widgets';

export interface SlashItem {
  title: string;
  description: string;
  icon: typeof Code;
  group: 'Text' | 'Embeds' | 'park.fan' | 'Widgets';
  /** Called with the editor to perform the actual insertion. */
  command: (ctx: { editor: import('@tiptap/core').Editor; range: { from: number; to: number } }) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (e: KeyboardEvent) => boolean;
}

interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

/**
 * The pop-up that follows the `/` cursor while typing. Headless layout — tippy
 * positions the wrapper; we render the rows + keyboard navigation. Exposes an
 * `onKeyDown` handle so the TipTap suggestion plugin can drive selection.
 */
export const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu(
  { items, command },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + items.length - 1) % Math.max(items.length, 1));
        return true;
      }
      if (e.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
        return true;
      }
      if (e.key === 'Enter') {
        const item = items[selectedIndex];
        if (item) command(item);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="border-border/60 bg-popover text-popover-foreground w-72 rounded-xl border p-3 text-xs shadow-xl">
        No matches — try a different word.
      </div>
    );
  }

  const groups = new Map<string, SlashItem[]>();
  for (const it of items) {
    if (!groups.has(it.group)) groups.set(it.group, []);
    groups.get(it.group)!.push(it);
  }

  let runningIndex = 0;
  return (
    <div className="border-border/60 bg-popover text-popover-foreground max-h-[60vh] w-72 overflow-y-auto rounded-xl border p-1 shadow-xl">
      {Array.from(groups.entries()).map(([group, list]) => (
        <div key={group}>
          <div className="text-muted-foreground mt-2 mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider first:mt-0">
            {group}
          </div>
          {list.map((it) => {
            const i = runningIndex++;
            const isActive = i === selectedIndex;
            const Icon = it.icon;
            const sty: CSSProperties = isActive ? { transform: 'translateX(2px)' } : {};
            return (
              <button
                key={it.title}
                type="button"
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => command(it)}
                style={sty}
                className={cn(
                  'flex w-full items-start gap-2 rounded-md p-2 text-left transition-all',
                  isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/40'
                )}
              >
                <div className="bg-primary/15 text-primary mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-tight">{it.title}</div>
                  <div className="text-muted-foreground text-xs leading-snug">
                    {it.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
});

/**
 * Catalog of slash commands — split into Text (Markdown basics), park.fan
 * (ref/widget) and Embeds (link-only blocks). The Park / Ride / Spotlight
 * actions hand off to a picker dialog (wired up in EditorCanvas) via custom
 * `data-slash-action` markers on the editor element.
 */
export function buildSlashItems(emit: (action: string) => void): SlashItem[] {
  const out: SlashItem[] = [
    {
      title: 'Heading 1',
      description: 'Big section title',
      icon: Heading1,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run(),
    },
    {
      title: 'Heading 2',
      description: 'Section heading',
      icon: Heading2,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run(),
    },
    {
      title: 'Heading 3',
      description: 'Subsection heading',
      icon: Heading3,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run(),
    },
    {
      title: 'Text',
      description: 'Plain paragraph',
      icon: Type,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      title: 'Bulleted list',
      description: 'Unordered list — Tab to nest',
      icon: List,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      title: 'Numbered list',
      description: 'Ordered list',
      icon: ListOrdered,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      title: 'Quote',
      description: 'Blockquote',
      icon: Quote,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      title: 'Code block',
      description: 'Fenced code',
      icon: Code,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      title: 'Divider',
      description: 'Horizontal rule',
      icon: Minus,
      group: 'Text',
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      title: 'Table',
      description: '3×3 starter — Tab to navigate',
      icon: TableIcon,
      group: 'Text',
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      title: 'Park',
      description: 'Inline link to a park',
      icon: MapPin,
      group: 'park.fan',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('park');
      },
    },
    {
      title: 'Ride',
      description: 'Inline link to an attraction',
      icon: TrainFront,
      group: 'park.fan',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('ride');
      },
    },
    {
      title: 'Spotlight card',
      description: 'Full park or ride card (?full)',
      icon: Sparkles,
      group: 'park.fan',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('spotlight');
      },
    },
    {
      title: 'Image',
      description: 'Inline image (URL or upload)',
      icon: ImageIcon,
      group: 'Embeds',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('image');
      },
    },
    {
      title: 'YouTube',
      description: 'Embed a video on its own line',
      icon: Film,
      group: 'Embeds',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('youtube');
      },
    },
    {
      title: 'Instagram',
      description: 'Embed a post/reel',
      icon: Camera,
      group: 'Embeds',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('instagram');
      },
    },
    {
      title: 'Suno song',
      description: 'Embed a Suno player',
      icon: Music,
      group: 'Embeds',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit('suno');
      },
    },
    // Widget fences — each emits the same `widget:<name>` action so the
    // canvas can insert a fresh codeBlock with the language attr already
    // set. The author edits the body attrs via the right-side
    // PropertiesPanel that flips on for the freshly-inserted chip.
    // Widget catalogue — synced with _lib/widgets.ts. Adding a widget kind
    // there auto-surfaces it here too.
    ...WIDGETS.map<SlashItem>((w) => ({
      title: w.label,
      description: w.hint,
      icon: w.icon,
      group: 'Widgets',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        emit(`widget:${w.name}`);
      },
    })),
  ];
  return out;
}
