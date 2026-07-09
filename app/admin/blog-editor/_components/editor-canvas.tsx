'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { ThemedTable } from '../_extensions/themed-table';
import {
  applyThemesToDoc,
  parseThemesFromMarkdown,
  serializeWithThemes,
} from '../_lib/table-theme-md';
import { Markdown } from 'tiptap-markdown';
import { SlashCommand } from '../_extensions/slash-command';
import { RefPreview } from '../_extensions/ref-preview';
import { WidgetPreview } from '../_extensions/widget-preview';
import { EmbedPreview } from '../_extensions/embed-preview';
import { ImagePreview } from '../_extensions/image-preview';
import { CalloutPreview } from '../_extensions/callout-preview';
import { ActiveChip } from '../_extensions/active-chip';
import { buildSlashItems } from './slash-menu';
import { EditorBubbleMenu } from './bubble-menu';
import { TableMenu } from './table-menu';
import { FixedToolbar, type ToolbarAction } from './fixed-toolbar';
import { ImagePicker, type ImagePickResult } from './image-picker';
import { ParkRidePicker, type PickerMode, type PickerResult } from './park-ride-picker';
import { getWidget } from '../_lib/widgets';
import { reanchorPos } from '../_lib/chip-utils';
import { addPendingImage } from '../_lib/pending-images';

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
  /** When set, the next ImagePicker pick replaces the existing img at this
   *  doc position rather than inserting a fresh image — driven by the
   *  PropertiesPanel's "Pick image…" action via a window event. The src is
   *  carried along so the position can be re-anchored at apply time if edits
   *  above the image shifted it. */
  const replaceImagePosRef = useRef<{ pos: number; src: string } | null>(null);
  /** True while applyThemesToDoc restores table themes after a setContent —
   *  that transaction changes the doc and would otherwise fire onUpdate,
   *  marking a freshly-loaded post as dirty (and overwriting the draft body
   *  with tiptap-markdown's normalisation of it). */
  const applyingThemesRef = useRef(false);
  /** When set, the next ParkRidePicker pick replaces an existing link at this
   *  position rather than inserting a fresh link. The PropertiesPanel asks
   *  for a replace via a window event; the canvas captures pos here. */
  const replacePosRef = useRef<number | null>(null);
  /** When the panel's widget form asks for a park slug via "Pick…", we open
   *  the ParkRidePicker in plain park-or-ride mode and remember the request
   *  id so the result event can be addressed back to the originating field. */
  const widgetPickRequestRef = useRef<string | null>(null);
  /** Chip rect for whichever surface triggered the image picker — drives
   *  anchored modal positioning instead of always-on-top. */
  const [imagePickerAnchor, setImagePickerAnchor] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);
  /** Trigger rect for the park/ride picker. Set when the picker is opened
   *  from a panel control so it floats near the click instead of pt-[15vh]. */
  const [parkPickerAnchor, setParkPickerAnchor] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);
  /** Render-time mirror of replaceImagePosRef.current so the ImagePicker can
   *  read `replaceMode` without us reading a ref during render (React 19
   *  forbids that — eslint-plugin-react-hooks/refs catches it). */
  const [imagePickerReplaceMode, setImagePickerReplaceMode] = useState(false);
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

  const insertWidget = (name: string) => {
    const ed = editorRef.current;
    if (!ed) return;
    const body = getWidget(name)?.defaultBody ?? '';
    const schema = ed.schema;
    const codeBlock = schema.nodes.codeBlock;
    if (!codeBlock) return;
    const node = codeBlock.create({ language: name }, body ? schema.text(body) : null);
    ed.chain().focus().insertContent(node.toJSON()).run();
  };

  const emit = (action: string) => {
    if (action === 'park' || action === 'ride' || action === 'spotlight') {
      setPickerMode(action);
    } else if (action === 'image') {
      setImagePickerOpen(true);
    } else if (action === 'youtube' || action === 'instagram' || action === 'suno') {
      runUrlEmbed(action);
    } else if (action.startsWith('widget:')) {
      insertWidget(action.slice('widget:'.length));
    }
  };

  const onToolbarEmit = (action: ToolbarAction) => emit(action);

  /** Stage pasted / dropped image files and insert their markdown at `pos`
   *  (or the current caret). The bytes ride along in the pending-images
   *  store until Save ships them as commits in the PR. */
  const insertUploadedImages = async (files: File[], pos?: number) => {
    const ed = editorRef.current;
    if (!ed) return;
    for (const file of files) {
      try {
        const staged = await addPendingImage(file);
        const md = `\n\n![${staged.name.replace(/\.[a-z0-9]+$/i, '')}](${staged.path})\n\n`;
        const chain = ed.chain().focus();
        if (pos !== undefined) chain.setTextSelection(Math.min(pos, ed.state.doc.content.size));
        chain.insertContent(md).run();
        pos = undefined; // subsequent files insert after the previous one
      } catch (err) {
        window.alert((err as Error).message);
      }
    }
  };

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
        isAllowedUri: (url) => /^(ref:|park:|attraction:|https?:\/\/|mailto:|\/)/.test(url),
        HTMLAttributes: { rel: 'noopener' },
      }),
      // `inline: true` lets the image live INSIDE a paragraph alongside
      // prose — so authors can put their caret next to a left/right-floated
      // image and type text that wraps around it. Without this the image is
      // its own block, the paragraph holds only the image, and there's
      // nothing to type into next to it.
      Image.configure({ inline: true, allowBase64: false }),
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'heading'
            ? `Heading ${node.attrs.level}`
            : "Press '/' for blocks · select text for formatting · or just write",
        showOnlyCurrent: true,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      ThemedTable.configure({ resizable: true }),
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
      ImagePreview,
      CalloutPreview,
      ActiveChip,
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
      // Paste / drop image files → stage them for the save-PR and insert
      // their markdown immediately. Non-image clipboard content falls
      // through to tiptap-markdown's regular paste handling.
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
          f.type.startsWith('image/')
        );
        if (!files.length) return false;
        event.preventDefault();
        void insertUploadedImages(files);
        return true;
      },
      // NOTE: image-file drops are handled by the canvas wrapper's React
      // onDrop (covers the whole card incl. padding); a PM-level handleDrop
      // here would double-insert since the event bubbles up to the wrapper.
    },
    onUpdate: ({ editor: e }) => {
      // Theme restoration after a load is not a user edit — swallowing it
      // here keeps freshly-opened posts clean (see applyingThemesRef).
      if (applyingThemesRef.current) return;
      const raw = (
        e.storage as unknown as { markdown: { getMarkdown: () => string } }
      ).markdown.getMarkdown();
      // tiptap-markdown drops table-level attrs on the floor — we re-inject
      // the theme as a leading `<!--tbl-theme: …-->` comment so the round
      // trip survives the save/load cycle.
      onMarkdownChange(serializeWithThemes(e, raw));
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
    const current = serializeWithThemes(
      editor,
      (
        editor.storage as unknown as { markdown: { getMarkdown: () => string } }
      ).markdown.getMarkdown()
    );
    if (current !== initialMarkdown) {
      // Strip our `<!--tbl-theme: …-->` comments before handing the markdown
      // to tiptap — it would emit them as literal text otherwise — then
      // re-apply the captured themes onto the freshly-parsed table nodes.
      const { cleaned, themes } = parseThemesFromMarkdown(initialMarkdown || '');
      editor.commands.setContent(cleaned, { emitUpdate: false });
      applyingThemesRef.current = true;
      try {
        applyThemesToDoc(editor, themes);
      } finally {
        applyingThemesRef.current = false;
      }
    }
  }, [initialMarkdown, editor]);

  const handlePick = (r: PickerResult) => {
    if (!editor) return;
    // Widget Pick… flow — the request originated from the PropertiesPanel
    // wanting a slug for a widget fence field. Fire the result back with
    // just the bare slug (last path segment) and close the picker without
    // touching the doc.
    if (widgetPickRequestRef.current) {
      // refKey looks like `/parks/europe/germany/bruehl/phantasialand[/attractions/<ride>]`;
      // the widget fields expect just the last slug component. For a ride
      // we also surface its parent park slug from the search hit so the
      // attraction-widget's parkSlug field auto-fills — the URL has an
      // intercalated `/attractions/` segment so slicing the path alone would
      // produce "attractions" instead of the park.
      const parts = r.refKey.split('/').filter(Boolean);
      const slug = parts[parts.length - 1] ?? r.refKey;
      window.dispatchEvent(
        new CustomEvent('parkfan-park-picker-result', {
          detail: {
            id: widgetPickRequestRef.current,
            slug,
            ...(r.parentParkSlug ? { parentParkSlug: r.parentParkSlug } : {}),
          },
        })
      );
      widgetPickRequestRef.current = null;
      setPickerMode(null);
      return;
    }
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
      const detail = (
        e as CustomEvent<{
          pos: number;
          isRide: boolean;
          rect?: { top: number; bottom: number; left: number; right: number };
        }>
      ).detail;
      replacePosRef.current = detail.pos;
      setParkPickerAnchor(detail.rect ?? null);
      setPickerMode(detail.isRide ? 'ride' : 'park');
    };
    const onImageRequest = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          pos: number;
          src?: string;
          rect?: { top: number; bottom: number; left: number; right: number };
        }>
      ).detail;
      replaceImagePosRef.current = { pos: detail.pos, src: detail.src ?? '' };
      setImagePickerAnchor(detail.rect ?? null);
      setImagePickerReplaceMode(true);
      setImagePickerOpen(true);
    };
    const onWidgetPickRequest = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          id: string;
          mode: 'park' | 'ride';
          rect?: { top: number; bottom: number; left: number; right: number };
        }>
      ).detail;
      widgetPickRequestRef.current = detail.id;
      setParkPickerAnchor(detail.rect ?? null);
      setPickerMode(detail.mode);
    };
    window.addEventListener('parkfan-replace-ref-request', onReplaceRequest as EventListener);
    window.addEventListener('parkfan-image-pick-request', onImageRequest as EventListener);
    window.addEventListener('parkfan-park-picker-request', onWidgetPickRequest as EventListener);
    return () => {
      window.removeEventListener('parkfan-image-pick-request', onImageRequest as EventListener);
      window.removeEventListener('parkfan-replace-ref-request', onReplaceRequest as EventListener);
      window.removeEventListener(
        'parkfan-park-picker-request',
        onWidgetPickRequest as EventListener
      );
    };
  }, []);

  return (
    <div className="relative">
      {/* Soft glow accent so the writing area visually anchors the page. */}
      <div
        aria-hidden="true"
        className="from-primary/20 via-primary/0 to-primary/10 pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br opacity-60 blur-sm"
      />
      <div
        // min-h matches the PropertiesPanel's sticky height
        // (h-[calc(100vh-6rem)]) so an empty/new editor and the panel end at
        // the same line; long content still grows past it naturally.
        className="border-border/60 bg-background/60 relative flex min-h-[calc(100vh-6rem)] flex-col rounded-2xl border p-8"
        // Catch image drops on the WHOLE canvas card, not just the exact
        // ProseMirror text area — dropping onto the padding / toolbar zone
        // used to make the browser navigate to the file instead of uploading.
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.items).some((i) => i.kind === 'file')) {
            e.preventDefault();
          }
        }}
        onDrop={(e) => {
          const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
          if (!files.length) return;
          e.preventDefault();
          const view = editorRef.current?.view;
          const coords = view?.posAtCoords({ left: e.clientX, top: e.clientY });
          void insertUploadedImages(files, coords?.pos);
        }}
      >
        <FixedToolbar editor={editor} onEmit={onToolbarEmit} />
        <EditorBubbleMenu editor={editor} />
        <TableMenu editor={editor} />
        {/* flex-1 stretches the editable area to the card's full height so
            clicking the empty space below short content focuses the editor
            (clicks inside the prose itself are left to ProseMirror). */}
        <EditorContent
          editor={editor}
          className="flex flex-1 flex-col [&>.tiptap-canvas]:flex-1"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              editorRef.current?.chain().focus('end').run();
            }
          }}
        />
        <ParkRidePicker
          mode={pickerMode}
          anchorRect={parkPickerAnchor ?? undefined}
          onPick={handlePick}
          onClose={() => {
            setPickerMode(null);
            setParkPickerAnchor(null);
          }}
        />
        <ImagePicker
          open={imagePickerOpen}
          onClose={() => {
            setImagePickerOpen(false);
            replaceImagePosRef.current = null;
            setImagePickerAnchor(null);
            setImagePickerReplaceMode(false);
          }}
          withCaption
          replaceMode={imagePickerReplaceMode}
          anchorRect={imagePickerAnchor ?? undefined}
          onPick={(r: ImagePickResult) => {
            if (!editor) return;
            // Replace flow — only the src changes; the panel will round-trip
            // alt/caption/align/size on its own next save.
            if (replaceImagePosRef.current !== null) {
              const req = replaceImagePosRef.current;
              // Edits between the chip click and the pick shift positions —
              // re-anchor on the nearest image still carrying the original
              // src so we never overwrite a neighbour.
              const pos = reanchorPos(
                editor.state.doc,
                req.pos,
                (n) =>
                  n.type.name === 'image' && (!req.src || String(n.attrs.src ?? '') === req.src)
              );
              if (pos === null) {
                replaceImagePosRef.current = null;
                setImagePickerReplaceMode(false);
                setImagePickerAnchor(null);
                return;
              }
              // Don't `.focus()` here — that would yank the editor's scroll
              // back to wherever the caret was sitting (often the top of the
              // doc), which is exactly the "picker scrolls everything to the
              // top" report. setNodeAttribute alone keeps the viewport stable.
              const prevNode = editor.state.doc.nodeAt(pos);
              const prevAlt =
                prevNode && prevNode.type.name === 'image' ? String(prevNode.attrs.alt ?? '') : '';
              editor
                .chain()
                .command(({ tr }) => {
                  const node = tr.doc.nodeAt(pos);
                  if (!node || node.type.name !== 'image') return false;
                  tr.setNodeAttribute(pos, 'src', r.src);
                  return true;
                })
                .run();
              // Re-emit the selection so the PropertiesPanel's preview img
              // re-binds to the new src — without this the right-hand thumbnail
              // would keep showing the old image until the user clicked
              // elsewhere and back.
              const altParts = prevAlt.split('|').map((s) => s.trim());
              window.dispatchEvent(
                new CustomEvent('parkfan-selection', {
                  detail: {
                    kind: 'image',
                    pos,
                    src: r.src,
                    alt: altParts[0] ?? '',
                    caption: altParts[1] ?? '',
                    align:
                      altParts[2] === 'left' || altParts[2] === 'right' || altParts[2] === 'wide'
                        ? altParts[2]
                        : 'center',
                    size:
                      altParts[3] === 'small' || altParts[3] === 'medium' || altParts[3] === 'large'
                        ? altParts[3]
                        : undefined,
                    rect: imagePickerAnchor ?? undefined,
                  },
                })
              );
              replaceImagePosRef.current = null;
              setImagePickerReplaceMode(false);
              setImagePickerAnchor(null);
              return;
            }
            // Inline-image insert — the image node lives INSIDE the current
            // paragraph (no leading/trailing blank lines), so the caret stays
            // in that paragraph after the insert and the author can keep
            // typing text right next to the picture.
            const altCombined = r.caption ? `${r.alt} | ${r.caption}` : r.alt;
            editor.chain().focus().insertContent(`![${altCombined}](${r.src}) `).run();
          }}
        />
      </div>
    </div>
  );
}
