'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';
import { SlashCommand } from '../_extensions/slash-command';
import { buildSlashItems } from './slash-menu';
import { EditorBubbleMenu } from './bubble-menu';
import { ParkRidePicker, type PickerMode, type PickerResult } from './park-ride-picker';

interface EditorCanvasProps {
  initialMarkdown: string;
  onMarkdownChange: (md: string) => void;
}

/**
 * TipTap canvas with Notion-style affordances: bubble menu on selection
 * (Bold/Italic/Strike/Code/Link), slash command on `/` for inserting blocks
 * (headings/lists/tables/code/divider) and our park.fan custom inserts
 * (Park/Ride/Spotlight via a search picker, plus YouTube/Instagram/Suno
 * embed prompts). The editor emits markdown on every change; we rely on
 * `tiptap-markdown` to keep our custom blocks structural via `[label](ref:…)`
 * links and bare embed-URL lines.
 */
export function EditorCanvas({ initialMarkdown, onMarkdownChange }: EditorCanvasProps) {
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  // Hold the editor in a ref too so the slash extension can fire actions
  // synchronously without sequencing through useState (which React 19 forbids
  // inside effects).
  const editorRef = useRef<Editor | null>(null);

  const runEmbed = (kind: 'youtube' | 'instagram' | 'suno' | 'image') => {
    const editor = editorRef.current;
    if (!editor) return;
    if (kind === 'image') {
      const url = window.prompt('Image URL (e.g. /blog/images/cover.svg)');
      if (!url) return;
      const alt = window.prompt('Alt text (optional)') ?? '';
      const caption = window.prompt('Caption (optional)') ?? '';
      const altCombined = caption ? `${alt} | ${caption}` : alt;
      editor.chain().focus().insertContent(`\n\n![${altCombined}](${url})\n\n`).run();
      return;
    }
    const url = window.prompt(`${kind[0].toUpperCase()}${kind.slice(1)} URL`);
    if (!url) return;
    editor.chain().focus().insertContent(`\n\n${url}\n\n`).run();
  };

  const emit = (action: string) => {
    if (action === 'park' || action === 'ride' || action === 'spotlight') {
      setPickerMode(action);
    } else if (
      action === 'image' ||
      action === 'youtube' ||
      action === 'instagram' ||
      action === 'suno'
    ) {
      runEmbed(action);
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'bg-muted rounded-md p-3' } } }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['ref', 'park', 'attraction', 'http', 'https', 'mailto'],
        HTMLAttributes: { rel: 'noopener' },
      }),
      Image,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? `Heading ${node.attrs.level}`
            : "Type '/' for blocks, or just write…",
        showOnlyCurrent: true,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      // buildSlashItems closes over `emit`, which reads editorRef.current —
      // but that read only happens when the user triggers a slash command at
      // runtime, never during render. React's lint can't see the lazy edge.
      // eslint-disable-next-line react-hooks/refs
      SlashCommand.configure({
        buildItems: () => buildSlashItems(emit),
      }),
    ],
    content: initialMarkdown || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-canvas prose prose-invert max-w-none min-h-[40vh] outline-none focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => {
      const md = (e.storage as unknown as { markdown: { getMarkdown: () => string } })
        .markdown.getMarkdown();
      onMarkdownChange(md);
    },
  });

  // Mirror the live editor instance into the ref so `runEmbed` (called by the
  // slash extension at runtime, after this render commits) can reach it.
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Keep the canvas in sync when the parent swaps the active draft (e.g. the
  // user flips to a different locale tab).
  useEffect(() => {
    if (!editor) return;
    const current = (
      editor.storage as unknown as { markdown: { getMarkdown: () => string } }
    ).markdown.getMarkdown();
    if (current !== initialMarkdown) {
      editor.commands.setContent(initialMarkdown || '', { emitUpdate: false });
    }
  }, [initialMarkdown, editor]);

  const handlePick = (r: PickerResult) => {
    if (!editor) return;
    if (pickerMode === 'spotlight') {
      const md = `\n\n[${r.label}](ref:${r.refKey}?full)\n\n`;
      editor.chain().focus().insertContent(md).run();
    } else {
      // Inline reference link with bare option so the live annotation doesn't
      // leak into mid-sentence prose. Authors can tweak to ?info later.
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: r.label,
          marks: [{ type: 'link', attrs: { href: `ref:${r.refKey}?bare` } }],
        })
        .run();
    }
    setPickerMode(null);
  };

  return (
    <div className="border-border/60 bg-background/40 rounded-2xl border p-6 backdrop-blur-sm">
      <EditorBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
      <ParkRidePicker
        mode={pickerMode}
        onPick={handlePick}
        onClose={() => setPickerMode(null)}
      />
    </div>
  );
}
