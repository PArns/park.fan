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
import { RefPreview } from '../_extensions/ref-preview';
import { WidgetPreview } from '../_extensions/widget-preview';
import { EmbedPreview } from '../_extensions/embed-preview';
import { buildSlashItems } from './slash-menu';
import { EditorBubbleMenu } from './bubble-menu';
import { FixedToolbar, type ToolbarAction } from './fixed-toolbar';
import { ImagePicker, type ImagePickResult } from './image-picker';
import { ParkRidePicker, type PickerMode, type PickerResult } from './park-ride-picker';

interface EditorCanvasProps {
  initialMarkdown: string;
  onMarkdownChange: (md: string) => void;
  /** Hand the TipTap editor instance up so the PropertiesPanel (rendered next
   *  to the canvas in editor-client) can drive commands directly without
   *  needing the canvas to proxy them. */
  onEditorReady?: (editor: Editor | null) => void;
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
export function EditorCanvas({
  initialMarkdown,
  onMarkdownChange,
  onEditorReady,
}: EditorCanvasProps) {
  const [pickerMode, setPickerMode] = useState<PickerMode | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  /** When set, the next ParkRidePicker pick replaces an existing link at this
   *  position rather than inserting a fresh link. The PropertiesPanel asks
   *  for a replace via a window event; the canvas captures pos here. */
  const replacePosRef = useRef<number | null>(null);
  // Hold the editor in a ref too so the slash extension can fire actions
  // synchronously without sequencing through useState (which React 19 forbids
  // inside effects).
  const editorRef = useRef<Editor | null>(null);

  const runUrlEmbed = (kind: 'youtube' | 'instagram' | 'suno') => {
    const editor = editorRef.current;
    if (!editor) return;
    const url = window.prompt(`${kind[0].toUpperCase()}${kind.slice(1)} URL`);
    if (!url) return;
    editor.chain().focus().insertContent(`\n\n${url}\n\n`).run();
  };

  const emit = (action: string) => {
    if (action === 'park' || action === 'ride' || action === 'spotlight') {
      setPickerMode(action);
    } else if (action === 'image') {
      setImagePickerOpen(true);
    } else if (action === 'youtube' || action === 'instagram' || action === 'suno') {
      runUrlEmbed(action);
    }
  };

  const onToolbarEmit = (action: ToolbarAction) => emit(action);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: 'bg-muted rounded-md p-3' } },
        // StarterKit v3 ships its own Link extension; we configure ours below
        // with stricter URL validation, so disable the bundled one to avoid the
        // "Duplicate extension names found: ['link']" warning.
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        protocols: ['ref', 'park', 'attraction', 'http', 'https', 'mailto'],
        // TipTap v3 has a stricter default URL validator that rejects our
        // `ref:/parks/<…>` form (and any plain absolute path). Whitelist the
        // protocols we serialise into markdown so setLink({href}) actually
        // sticks. Inline scheme defangs `javascript:` and `data:` URIs.
        isAllowedUri: (url) =>
          /^(ref:|park:|attraction:|https?:\/\/|mailto:|\/)/.test(url),
        HTMLAttributes: { rel: 'noopener' },
      }),
      Image,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? `Heading ${node.attrs.level}`
            : "Press '/' for blocks · select text for formatting · or just write",
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
      RefPreview,
      WidgetPreview,
      EmbedPreview,
    ],
    content: initialMarkdown || '',
    editorProps: {
      attributes: {
        class:
          'tiptap-canvas prose prose-invert max-w-none min-h-[60vh] outline-none focus:outline-none',
      },
      // Ref / park / attraction links are authoring markers, never real URLs —
      // call preventDefault so the browser doesn't navigate to `ref:phantasialand?bare`,
      // but return `false` so the click STILL reaches ref-preview's handleClick
      // (which fires the selection event that drives the PropertiesPanel).
      handleClickOn(_view, _pos, _node, _nodePos, event) {
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest('a');
        if (!anchor) return false;
        const href = anchor.getAttribute('href') ?? '';
        if (/^(ref:|park:|attraction:)/.test(href)) {
          event.preventDefault();
        }
        return false;
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
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

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
    // Defend against incidental whitespace from the search backend so the
    // inserted markdown doesn't end up `[Phantasialand ](ref:…)`.
    const label = r.label.trim();
    // Replace flow — when the user came in via "Replace…" from the panel.
    // We resolve the link range from the click pos at apply time so the
    // operation always targets the link that's actually there now.
    if (replacePosRef.current !== null) {
      const pos = replacePosRef.current;
      const opt = pickerMode === 'spotlight' ? 'full' : r.option;
      const newHref = `ref:${r.refKey}?${opt}`;
      editor
        .chain()
        .focus()
        .setTextSelection(pos)
        .extendMarkRange('link')
        .deleteSelection()
        .insertContent({
          type: 'text',
          text: label,
          marks: [{ type: 'link', attrs: { href: newHref } }],
        })
        .unsetMark('link')
        .run();
      replacePosRef.current = null;
    } else if (pickerMode === 'spotlight' || r.option === 'full') {
      // Block card always uses ?full — that's what triggers the spotlight
      // render. Comes in here from the standalone Spotlight insert OR when
      // the author picks the Full variant in a Park/Ride dialog. Wrapping
      // with `\n\n` lifts the link into its own paragraph so the renderer
      // hoists it into the block card on publish.
      const md = `\n\n[${label}](ref:${r.refKey}?full)\n\n`;
      editor.chain().focus().insertContent(md).run();
    } else {
      // Inline reference link — the variant (info/bare) was picked in the
      // dialog footer. We append the option flag so the renderer picks it up.
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'text',
          text: label,
          marks: [{ type: 'link', attrs: { href: `ref:${r.refKey}?${r.option}` } }],
        })
        // Drop the link mark right after the inserted text so the next character
        // the author types isn't sucked into the link.
        .unsetMark('link')
        .run();
    }
    setPickerMode(null);
  };

  // The PropertiesPanel (rendered next to this canvas by editor-client) fires
  // this when the author hits "Replace park / ride" — we stash the clicked
  // pos and open our picker. handlePick then resolves the link range fresh
  // and swaps content.
  useEffect(() => {
    const onReplaceRequest = (e: Event) => {
      const detail = (e as CustomEvent<{ pos: number; isRide: boolean }>).detail;
      replacePosRef.current = detail.pos;
      setPickerMode(detail.isRide ? 'ride' : 'park');
    };
    window.addEventListener('parkfan-replace-ref-request', onReplaceRequest as EventListener);
    return () =>
      window.removeEventListener(
        'parkfan-replace-ref-request',
        onReplaceRequest as EventListener
      );
  }, []);

  return (
    <div className="relative">
      {/* Soft glow accent so the writing area visually anchors the page. */}
      <div
        aria-hidden="true"
        className="from-primary/20 via-primary/0 to-primary/10 pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-60 blur-sm"
      />
      <div className="border-border/60 bg-background/60 relative overflow-hidden rounded-2xl border p-8 backdrop-blur-md">
        <FixedToolbar editor={editor} onEmit={onToolbarEmit} />
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
        <ParkRidePicker
          mode={pickerMode}
          onPick={handlePick}
          onClose={() => setPickerMode(null)}
        />
        <ImagePicker
          open={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          withCaption
          onPick={(r: ImagePickResult) => {
            const altCombined = r.caption ? `${r.alt} | ${r.caption}` : r.alt;
            editor?.chain().focus().insertContent(`\n\n![${altCombined}](${r.src})\n\n`).run();
          }}
        />
      </div>
    </div>
  );
}
