'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';

interface EditorCanvasProps {
  initialMarkdown: string;
  onMarkdownChange: (md: string) => void;
}

/**
 * TipTap canvas with the rich-text extensions we care about (markdown
 * round-trip, links, images, tables, typography niceties like smart quotes).
 * The editor emits markdown on every change so the live preview stays in
 * sync, and we'll later layer custom nodes (ref:, widgets, embeds) on top.
 */
export function EditorCanvas({ initialMarkdown, onMarkdownChange }: EditorCanvasProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: { HTMLAttributes: { class: 'bg-muted rounded-md p-3' } } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener' } }),
      Image,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? `Heading ${node.attrs.level}`
            : "Start writing… (more block types coming via '/')",
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
    ],
    content: initialMarkdown || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-canvas prose prose-invert max-w-none min-h-[40vh] outline-none focus:outline-none',
      },
    },
    onUpdate: ({ editor: e }) => {
      const md = (e.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown();
      onMarkdownChange(md);
    },
  });

  // Keep the canvas in sync if the parent loads a different markdown body
  // (e.g., opening a different post). Avoids stomping on user edits.
  useEffect(() => {
    if (!editor) return;
    const current = (
      editor.storage as unknown as { markdown: { getMarkdown: () => string } }
    ).markdown.getMarkdown();
    if (current !== initialMarkdown) {
      editor.commands.setContent(initialMarkdown || '', { emitUpdate: false });
    }
  }, [initialMarkdown, editor]);

  return (
    <div className="border-border/60 bg-background/40 rounded-2xl border p-6 backdrop-blur-sm">
      <EditorContent editor={editor} />
    </div>
  );
}
