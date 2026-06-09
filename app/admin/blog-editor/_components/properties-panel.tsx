'use client';

import { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Boxes,
  Camera,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize,
  MapPin,
  MousePointerClick,
  Music,
  Replace,
  Sparkles,
  Trash2,
  TrainFront,
} from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import { getWidget, widgetLabel } from '../_lib/widgets';

export type EditorSelection =
  | {
      kind: 'ref';
      /** Start of the link mark in the doc — used directly by setTextSelection
       *  so we don't have to re-resolve via extendMarkRange (which can extend
       *  to the wrong link if the click resolved inside an adjacent span). */
      pos: number;
      from: number;
      to: number;
      href: string;
      /** Raw ref value (without leading `ref:`) — drives label heuristics. */
      value: string;
      /** Author-visible link text, captured at click time. Used as the panel
       *  title so the inspector reads "bare" / "full" / "Phantasialand" —
       *  whatever the author typed — instead of always reading the slug. */
      label?: string;
    }
  | { kind: 'link'; pos: number; from: number; to: number; href: string }
  | {
      kind: 'widget';
      /** Widget name as it appears in the fence info string (park-widget,
       *  attraction-widget, weather-widget, …). */
      name: string;
      /** Current attrs parsed from the body, what the panel edits. */
      attrs: Record<string, string>;
      /** Whole codeBlock node range so saves can replace it cleanly. */
      nodeFrom: number;
      nodeTo: number;
      pos: number;
    }
  | {
      kind: 'image';
      pos: number;
      src: string;
      alt: string;
      caption: string;
      align: 'center' | 'left' | 'right' | 'wide';
      size?: 'small' | 'medium' | 'large';
      /** Carried through from the chip click so the ImagePicker (when the
       *  panel opens it via Pick…) can anchor itself near the image. */
      rect?: { top: number; bottom: number; left: number; right: number };
    }
  | {
      kind: 'embed';
      /** Bare URL embed paragraph (YouTube / Instagram / Suno). */
      provider: 'youtube' | 'instagram' | 'suno';
      href: string;
      paragraphFrom: number;
      paragraphTo: number;
      pos: number;
    }
  | null;

interface PropertiesPanelProps {
  editor: Editor | null;
  selection: EditorSelection;
  /** Total markdown length — shown in the empty state stats. */
  charCount: number;
  /** Triggered when the author asks to swap the underlying park/ride. The
   *  rect (when supplied) anchors the picker near the click instead of
   *  floating at the top of the viewport. */
  onReplaceRef: (rect?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => void;
}

/**
 * Notion-style right-hand inspector. Replaces the popovers — clicking any
 * chip in the editor selects it here, so editing scales to N chips without
 * the stale-position weirdness the floating popovers ran into.
 *
 * Each section snapshots the selection's pos and operates via TipTap commands
 * (setTextSelection → extendMarkRange → setLink/unsetLink). The doc is the
 * source of truth at every keystroke — no cached from/to on the DOM.
 */
export function PropertiesPanel({
  editor,
  selection,
  charCount,
  onReplaceRef,
}: PropertiesPanelProps) {
  return (
    <aside className="border-border/60 bg-card/30 sticky top-4 h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border backdrop-blur-sm">
      <div className="border-border/40 flex items-center justify-between border-b px-4 py-3">
        <div className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          <span className="bg-primary/40 h-1 w-1 rounded-full" />
          Properties
        </div>
        {selection && (
          <span className="text-muted-foreground/80 inline-flex items-center gap-1 rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
            {selection.kind === 'ref'
              ? 'ref chip'
              : selection.kind === 'link'
                ? 'link'
                : selection.kind === 'widget'
                  ? 'widget'
                  : selection.kind === 'image'
                    ? 'image'
                    : 'embed'}
          </span>
        )}
      </div>

      <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 py-4">
        {selection?.kind === 'ref' ? (
          <RefProperties
            editor={editor}
            selection={selection}
            onReplaceRef={onReplaceRef}
          />
        ) : selection?.kind === 'link' ? (
          <LinkProperties editor={editor} selection={selection} />
        ) : selection?.kind === 'widget' ? (
          <WidgetProperties editor={editor} selection={selection} />
        ) : selection?.kind === 'image' ? (
          <ImageProperties editor={editor} selection={selection} />
        ) : selection?.kind === 'embed' ? (
          <EmbedProperties editor={editor} selection={selection} />
        ) : (
          <EmptyState charCount={charCount} />
        )}
      </div>
    </aside>
  );
}

function EmptyState({ charCount }: { charCount: number }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="bg-muted/30 mb-3 flex h-12 w-12 items-center justify-center rounded-2xl">
        <MousePointerClick className="text-muted-foreground/70 h-5 w-5" />
      </div>
      <div className="text-foreground/80 text-sm font-semibold">Nothing selected</div>
      <p className="text-muted-foreground mt-1 max-w-[220px] text-xs leading-relaxed">
        Click any chip — park, ride, link or spotlight — in the editor to
        inspect and edit it here.
      </p>
      <div className="text-muted-foreground/70 mt-6 inline-flex items-center gap-3 rounded-full bg-muted/30 px-3 py-1.5 text-[10px] font-medium">
        <span>{charCount.toLocaleString()} chars</span>
      </div>
    </div>
  );
}

function RefProperties({
  editor,
  selection,
  onReplaceRef,
}: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'ref' }>;
  onReplaceRef: (rect?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }) => void;
}) {
  // Pull the current variant fresh from the href every render so external
  // edits to the link mark (e.g. via the source view) reflect immediately.
  const currentOpt = parseVariant(selection.href);
  const isRide = isRideRef(selection.value);

  const setVariant = (variant: 'info' | 'bare' | 'full') => {
    if (!editor) return;
    const value = selection.value;
    const newHref = `ref:${value}?${variant}`;
    // setTextSelection over the FULL link range and replace the mark — never
    // use extendMarkRange here. ProseMirror's mark-range extension can drift
    // into an adjacent link when the source link is the trailing edge of a
    // paragraph (which is exactly the case for inline ?info / ?long badges
    // and the post-link widget anchor of ?full spotlights).
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .setMark('link', { href: newHref })
      .run();
    // Re-emit the selection event so the panel's `currentOpt` reflects the
    // new href on the next render — otherwise the pill stays glued to the
    // previous variant even though the doc has updated.
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: { ...selection, href: newHref },
      })
    );
  };
  const removeLink = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .run();
    // Clear the panel — the underlying link is gone.
    window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
  };

  return (
    <div className="space-y-4">
      <Header
        icon={isRide ? TrainFront : MapPin}
        kind={isRide ? 'Ride reference' : 'Park reference'}
        title={selection.label?.trim() || prettyName(selection.value)}
        subtitle={`→ ${prettyName(selection.value)} · ${selection.value}`}
      />

      <Section label="Variant">
        <div className="bg-muted/40 inline-flex w-full overflow-hidden rounded-xl p-1">
          {(['info', 'bare', 'full'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariant(v)}
              className={cn(
                'flex-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all',
                currentOpt === v
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground/80 mt-2 text-[11px] leading-relaxed">
          {currentOpt === 'info' &&
            'Inline link · city/park + live status badge.'}
          {currentOpt === 'bare' && 'Inline link · no annotation.'}
          {currentOpt === 'full' &&
            'Block spotlight card with background image (renders as its own paragraph).'}
        </p>
      </Section>

      <Section label="Actions">
        <div className="grid gap-1.5">
          <ActionButton
            onClick={(ev) => {
              const r = ev.currentTarget.getBoundingClientRect();
              onReplaceRef({
                top: r.top,
                bottom: r.bottom,
                left: r.left,
                right: r.right,
              });
            }}
            icon={Replace}
          >
            Replace park / ride…
          </ActionButton>
          <ActionButton onClick={removeLink} icon={Trash2} destructive>
            Unlink
          </ActionButton>
        </div>
      </Section>

      <Section label="Reference">
        <code className="bg-muted/40 text-foreground/80 block break-all rounded-md px-2 py-1.5 font-mono text-[10px]">
          ref:{selection.value}?{currentOpt}
        </code>
      </Section>
    </div>
  );
}

/**
 * Inner thin wrapper so the form remounts (`key={pos}`) every time a different
 * chip is selected — that resets the uncontrolled state cleanly without
 * the `setState-in-effect` lint trap on React 19.
 */
function LinkProperties(props: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'link' }>;
}) {
  return <LinkPropertiesForm key={props.selection.pos} {...props} />;
}

function LinkPropertiesForm({
  editor,
  selection,
}: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'link' }>;
}) {
  const [href, setHref] = useState(selection.href);

  const save = () => {
    if (!editor) return;
    const trimmed = href.trim();
    if (!trimmed) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: selection.from, to: selection.to })
        .unsetMark('link')
        .run();
      window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
      return;
    }
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .setMark('link', { href: trimmed })
      .run();
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: { ...selection, href: trimmed },
      })
    );
  };
  const remove = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .run();
    window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
  };

  return (
    <div className="space-y-4">
      <Header
        icon={LinkIcon}
        kind="Hyperlink"
        title={href || '(no URL)'}
        subtitle={detectLinkKind(href)}
      />

      <Section label="URL">
        <div className="flex items-center gap-1.5">
          <input
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder="https://…"
            className="border-border/60 bg-background/60 text-foreground flex-1 rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none"
          />
          {href.startsWith('http') && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="hover:bg-accent/40 text-muted-foreground hover:text-foreground inline-flex h-8 w-8 items-center justify-center rounded-md"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </Section>

      <Section label="Actions">
        <div className="grid gap-1.5">
          <ActionButton onClick={save} icon={Sparkles}>
            Save URL
          </ActionButton>
          <ActionButton onClick={remove} icon={Trash2} destructive>
            Unlink
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}

/**
 * Per-widget editable attr matrix. Each kind only surfaces the fields the
 * blog renderer cares about — author can still drop into the .md source view
 * if they want something exotic.
 */
// Field roster per widget kind comes from the shared registry — see
// _lib/widgets.ts for the catalogue. Adding a widget there auto-surfaces the
// matching panel form here.

function WidgetProperties(props: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'widget' }>;
}) {
  // Remount whenever the selected widget changes so the local form state
  // re-initialises from the new attrs cleanly.
  return <WidgetForm key={`${props.selection.nodeFrom}-${props.selection.name}`} {...props} />;
}

function WidgetForm({
  editor,
  selection,
}: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'widget' }>;
}) {
  const fields = getWidget(selection.name)?.fields ?? [];
  const [attrs, setAttrs] = useState<Record<string, string>>(() => ({ ...selection.attrs }));

  const save = () => {
    if (!editor) return;
    // Serialise the new attrs into one body line per key (the renderer
    // already handles this form) and replace the codeBlock's whole content
    // with it. Keeping the language attr intact preserves the widget name
    // in the fence info string.
    const body = fields
      .map((f) => `${f.key}: ${attrs[f.key]?.trim() ?? ''}`)
      .filter((line) => !line.endsWith(': '))
      .join('\n');
    const schema = editor.schema;
    const codeBlock = schema.nodes.codeBlock;
    if (!codeBlock) return;
    const newNode = codeBlock.create(
      { language: selection.name },
      body ? schema.text(body) : null
    );
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceRangeWith(selection.nodeFrom, selection.nodeTo, newNode);
        return true;
      })
      .run();
    // Re-emit so the panel pulls the fresh attrs from the cleaned-up body.
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: {
          ...selection,
          attrs: { ...attrs },
          nodeTo: selection.nodeFrom + newNode.nodeSize,
        },
      })
    );
  };

  const removeWidget = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.delete(selection.nodeFrom, selection.nodeTo);
        return true;
      })
      .run();
    window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
  };

  return (
    <div className="space-y-4">
      <Header
        icon={Boxes}
        kind={widgetLabel(selection.name)}
        title={attrs.slug || attrs.parkSlug || attrs.folder || '(missing config)'}
        subtitle={selection.name}
      />

      {fields.map((f) => {
        // Which fields are "park" or "ride" slugs — those get a Pick button
        // that opens the ParkRidePicker via a window event the editor-canvas
        // catches. Keeps the panel ignorant of the picker's React state.
        const pickerMode: 'park' | 'ride' | null = ((): 'park' | 'ride' | null => {
          if (f.key === 'parkSlug') return 'park';
          if (f.key === 'slug') {
            if (selection.name === 'attraction-widget') return 'ride';
            if (selection.name === 'glossary-widget') return null;
            if (selection.name === 'gallery-widget') return null;
            return 'park';
          }
          return null;
        })();
        const openPicker = (ev: React.MouseEvent<HTMLButtonElement>) => {
          if (!pickerMode) return;
          // Anchor the picker near the trigger button so it doesn't always
          // float at the top of the viewport.
          const btnRect = ev.currentTarget.getBoundingClientRect();
          const rect = {
            top: btnRect.top,
            bottom: btnRect.bottom,
            left: btnRect.left,
            right: btnRect.right,
          };
          const id = `pick-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const onResult = (ev: Event) => {
            const detail = (
              ev as CustomEvent<{ id: string; slug: string; parentParkSlug?: string }>
            ).detail;
            if (detail.id !== id) return;
            window.removeEventListener(
              'parkfan-park-picker-result',
              onResult as EventListener
            );
            // Pull the latest attrs to avoid stomping fields the user edited
            // between opening and choosing. When picking a ride for the
            // attraction-widget we also auto-fill parkSlug from the ride's
            // parent — otherwise the author has to pick twice.
            const hasParkSlugField = fields.some((x) => x.key === 'parkSlug');
            setAttrs((prev) => {
              const next = { ...prev, [f.key]: detail.slug };
              if (detail.parentParkSlug && pickerMode === 'ride' && hasParkSlugField) {
                next.parkSlug = detail.parentParkSlug;
              }
              return next;
            });
          };
          window.addEventListener(
            'parkfan-park-picker-result',
            onResult as EventListener
          );
          window.dispatchEvent(
            new CustomEvent('parkfan-park-picker-request', {
              detail: { id, mode: pickerMode, rect },
            })
          );
        };
        return (
          <Section key={f.key} label={f.label}>
            <div className="flex items-center gap-1.5">
              <input
                value={attrs[f.key] ?? ''}
                onChange={(e) =>
                  setAttrs((prev) => ({ ...prev, [f.key]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                }}
                placeholder={f.placeholder}
                className="border-border/60 bg-background/60 text-foreground flex-1 rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none"
              />
              {pickerMode && (
                <button
                  type="button"
                  onClick={openPicker}
                  title={pickerMode === 'ride' ? 'Pick a ride…' : 'Pick a park…'}
                  className="hover:bg-accent/50 text-primary border-border/60 inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors"
                >
                  <Replace className="h-3 w-3" />
                  Pick…
                </button>
              )}
            </div>
          </Section>
        );
      })}

      <Section label="Actions">
        <div className="grid gap-1.5">
          <ActionButton onClick={save} icon={Sparkles}>
            Save attrs
          </ActionButton>
          <ActionButton onClick={removeWidget} icon={Trash2} destructive>
            Delete widget
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}


/**
 * Re-mount the image form on every new selection so its uncontrolled fields
 * pick up the new image cleanly without an in-effect setState dance.
 */
/**
 * Bare-URL embed paragraph editor. The chip in the canvas represents a
 * paragraph whose only content is a YouTube / Instagram / Suno URL — saving
 * replaces the paragraph's content with the new URL, deletion drops the whole
 * paragraph (and adjacent blank lines collapse on the next markdown round-trip).
 */
function EmbedProperties(props: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'embed' }>;
}) {
  return <EmbedForm key={props.selection.paragraphFrom} {...props} />;
}

function EmbedForm({
  editor,
  selection,
}: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'embed' }>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const providerIcon =
    selection.provider === 'youtube'
      ? Film
      : selection.provider === 'instagram'
        ? Camera
        : Music;
  const providerLabel =
    selection.provider === 'youtube'
      ? 'YouTube embed'
      : selection.provider === 'instagram'
        ? 'Instagram embed'
        : 'Suno embed';

  const save = () => {
    if (!editor) return;
    const next = (inputRef.current?.value ?? '').trim();
    if (!next) return;
    const schema = editor.schema;
    const paragraph = schema.nodes.paragraph;
    if (!paragraph) return;
    const node = paragraph.create(null, schema.text(next));
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.replaceRangeWith(selection.paragraphFrom, selection.paragraphTo, node);
        return true;
      })
      .run();
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: {
          ...selection,
          href: next,
          paragraphTo: selection.paragraphFrom + node.nodeSize,
        },
      })
    );
  };
  const remove = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.delete(selection.paragraphFrom, selection.paragraphTo);
        return true;
      })
      .run();
    window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
  };

  return (
    <div className="space-y-4">
      <Header
        icon={providerIcon}
        kind={providerLabel}
        title={selection.href}
        subtitle="paragraph-only URL · renders as embed at publish"
      />

      <Section label="URL">
        <input
          key={selection.href}
          ref={inputRef}
          defaultValue={selection.href}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
          placeholder="https://…"
          className="border-border/60 bg-background/60 text-foreground w-full rounded-lg border px-2.5 py-1.5 font-mono text-[11px] outline-none"
        />
      </Section>

      <Section label="Actions">
        <div className="grid gap-1.5">
          <ActionButton onClick={save} icon={Sparkles}>
            Save URL
          </ActionButton>
          {selection.href.startsWith('http') && (
            <a
              href={selection.href}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border/60 hover:border-primary/40 hover:bg-primary/10 text-foreground/85 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in new tab
            </a>
          )}
          <ActionButton onClick={remove} icon={Trash2} destructive>
            Delete embed
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}

function ImageProperties(props: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'image' }>;
}) {
  return <ImageForm key={`${props.selection.pos}-${props.selection.src}`} {...props} />;
}

const ALIGN_OPTIONS: Array<{
  k: 'left' | 'center' | 'right' | 'wide';
  label: string;
  icon: typeof AlignLeft;
}> = [
  { k: 'left', label: 'Left', icon: AlignLeft },
  { k: 'center', label: 'Center', icon: AlignCenter },
  { k: 'right', label: 'Right', icon: AlignRight },
  { k: 'wide', label: 'Wide', icon: Maximize },
];

const SIZE_OPTIONS: Array<{ k: '' | 'small' | 'medium' | 'large'; label: string }> = [
  { k: '', label: 'Auto' },
  { k: 'small', label: 'Small' },
  { k: 'medium', label: 'Medium' },
  { k: 'large', label: 'Large' },
];

function ImageForm({
  editor,
  selection,
}: {
  editor: Editor | null;
  selection: Extract<EditorSelection, { kind: 'image' }>;
}) {
  const [alt, setAlt] = useState(selection.alt);
  const [caption, setCaption] = useState(selection.caption);
  const [align, setAlign] = useState<typeof selection.align>(selection.align);
  const [size, setSize] = useState<'' | 'small' | 'medium' | 'large'>(
    selection.size ?? ''
  );

  const buildAltStringFrom = (
    partsIn: { alt: string; caption: string; align: typeof selection.align; size: '' | 'small' | 'medium' | 'large' }
  ) => {
    const parts: string[] = [partsIn.alt.trim()];
    const hasMeta = !!partsIn.caption.trim() || partsIn.align !== 'center' || !!partsIn.size;
    if (hasMeta) parts.push(partsIn.caption.trim());
    if (partsIn.align !== 'center' || partsIn.size) parts.push(partsIn.align);
    if (partsIn.size) parts.push(partsIn.size);
    return parts.join(' | ');
  };

  /** Write a new alt string into the doc — used by both the manual Save button
   *  (for alt + caption text) and the live align/size toggles which apply on
   *  click instead of waiting for Save. */
  const writeAlt = (next: {
    alt: string;
    caption: string;
    align: typeof selection.align;
    size: '' | 'small' | 'medium' | 'large';
  }) => {
    if (!editor) return;
    const altString = buildAltStringFrom(next);
    editor
      .chain()
      .command(({ tr }) => {
        tr.setNodeAttribute(selection.pos, 'alt', altString);
        return true;
      })
      .run();
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: {
          ...selection,
          alt: next.alt,
          caption: next.caption,
          align: next.align,
          size: next.size || undefined,
        },
      })
    );
  };

  const setAlignLive = (k: typeof selection.align) => {
    setAlign(k);
    writeAlt({ alt, caption, align: k, size });
  };
  const setSizeLive = (k: '' | 'small' | 'medium' | 'large') => {
    setSize(k);
    writeAlt({ alt, caption, align, size: k });
  };

  const save = () => writeAlt({ alt, caption, align, size });
  const remove = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        const node = tr.doc.nodeAt(selection.pos);
        if (!node) return false;
        tr.delete(selection.pos, selection.pos + node.nodeSize);
        return true;
      })
      .run();
    window.dispatchEvent(new CustomEvent('parkfan-clear-selection'));
  };
  const pickImage = () => {
    // Re-resolve the image's live position right before opening — the rect we
    // captured at click time goes stale as soon as the author scrolls or
    // adds/removes content above. Walking the canvas for the matching <img>
    // gives the picker a fresh anchor every time.
    const liveRect = ((): typeof selection.rect | undefined => {
      const canvas = document.querySelector('.tiptap-canvas');
      if (!canvas) return selection.rect;
      const imgs = canvas.querySelectorAll<HTMLImageElement>('img');
      for (const img of imgs) {
        if (img.getAttribute('src') === selection.src) {
          const r = img.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }
      }
      return selection.rect;
    })();
    window.dispatchEvent(
      new CustomEvent('parkfan-image-pick-request', {
        detail: { pos: selection.pos, rect: liveRect },
      })
    );
  };

  return (
    <div className="space-y-4">
      <Header
        icon={ImageIcon}
        kind="Image"
        title={alt || '(no alt text)'}
        subtitle={selection.src}
      />

      <Section label="Preview">
        <div className="border-border/60 bg-muted/30 relative h-32 w-full overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selection.src}
            alt={alt}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </Section>

      <Section label="Source">
        <div className="flex items-center gap-1.5">
          <input
            value={selection.src}
            readOnly
            className="border-border/60 bg-background/60 text-muted-foreground flex-1 truncate rounded-lg border px-2.5 py-1.5 font-mono text-[10px] outline-none"
          />
          <button
            type="button"
            onClick={pickImage}
            className="hover:bg-accent/50 text-primary border-border/60 inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors"
          >
            <Replace className="h-3 w-3" />
            Pick…
          </button>
        </div>
      </Section>

      <Section label="Alt text">
        <input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe the image for screen readers"
          className="border-border/60 bg-background/60 text-foreground w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
        />
      </Section>

      <Section label="Caption">
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Shown below the image (optional)"
          className="border-border/60 bg-background/60 text-foreground w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
        />
      </Section>

      <Section label="Alignment">
        <div className="bg-muted/40 grid grid-cols-4 gap-1 rounded-xl p-1">
          {ALIGN_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.k}
                type="button"
                title={opt.label}
                onClick={() => setAlignLive(opt.k)}
                className={cn(
                  'inline-flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all',
                  align === opt.k
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section label="Size">
        <div className="bg-muted/40 grid grid-cols-4 gap-1 rounded-xl p-1">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.k}
              type="button"
              onClick={() => setSizeLive(opt.k)}
              className={cn(
                'rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all',
                size === opt.k
                  ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Actions">
        <div className="grid gap-1.5">
          <ActionButton onClick={save} icon={Sparkles}>
            Save changes
          </ActionButton>
          <ActionButton onClick={remove} icon={Trash2} destructive>
            Delete image
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground mb-1.5 text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </div>
      {children}
    </div>
  );
}

function Header({
  icon: Icon,
  kind,
  title,
  subtitle,
}: {
  icon: typeof MapPin;
  kind: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="border-border/40 -mt-1 flex items-center gap-3 border-b pb-4">
      <div className="from-primary/20 to-primary/5 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">
          {kind}
        </div>
        <div className="text-foreground truncate text-sm font-semibold">{title}</div>
        <div className="text-muted-foreground/80 truncate font-mono text-[10px]">{subtitle}</div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  destructive,
  children,
}: {
  onClick: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  icon: typeof MapPin;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
        destructive
          ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
          : 'border-border/60 hover:border-primary/40 hover:bg-primary/10 text-foreground/85'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function parseVariant(href: string): 'info' | 'bare' | 'full' {
  if (!href.startsWith('ref:')) return 'info';
  const q = href.indexOf('?');
  if (q === -1) return 'info';
  const opt = href.slice(q + 1).split(/[&=]/)[0]?.toLowerCase();
  if (opt === 'bare') return 'bare';
  if (opt === 'full') return 'full';
  return 'info';
}

function isRideRef(value: string): boolean {
  if (value.startsWith('/parks/')) {
    return value.slice('/parks/'.length).split('/').filter(Boolean).length >= 5;
  }
  return value.includes('/');
}

function prettyName(value: string): string {
  const last = value.split('/').filter(Boolean).pop() ?? value;
  return last
    .split('-')
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

function detectLinkKind(href: string): string {
  if (!href) return '';
  if (href.startsWith('mailto:')) return 'Email';
  if (href.startsWith('http://') || href.startsWith('https://')) return 'External URL';
  if (href.startsWith('/')) return 'Internal path';
  return 'Custom protocol';
}
