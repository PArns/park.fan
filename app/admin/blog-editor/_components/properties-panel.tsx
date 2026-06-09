'use client';

import { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Boxes,
  ExternalLink,
  Image as ImageIcon,
  Link as LinkIcon,
  Maximize,
  MapPin,
  MousePointerClick,
  Replace,
  Sparkles,
  Trash2,
  TrainFront,
} from 'lucide-react';
import type { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';

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
    }
  | null;

interface PropertiesPanelProps {
  editor: Editor | null;
  selection: EditorSelection;
  /** Total markdown length — shown in the empty state stats. */
  charCount: number;
  /** Triggered when the author asks to swap the underlying park/ride. */
  onReplaceRef: () => void;
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
                  : 'image'}
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
  onReplaceRef: () => void;
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
        title={prettyName(selection.value)}
        subtitle={selection.value}
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
          <ActionButton onClick={onReplaceRef} icon={Replace}>
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
const WIDGET_FIELDS: Record<string, Array<{ key: string; label: string; placeholder?: string }>> = {
  'park-widget': [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
  'map-widget': [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
  'weather-widget': [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
  'best-days-widget': [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
  'stats-widget': [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
  'attraction-widget': [
    { key: 'parkSlug', label: 'Park slug', placeholder: 'phantasialand' },
    { key: 'slug', label: 'Ride slug', placeholder: 'black-mamba' },
  ],
  'gallery-widget': [
    { key: 'folder', label: 'Folder', placeholder: '/blog/images' },
    { key: 'heading', label: 'Heading', placeholder: 'Highlights' },
  ],
  'glossary-widget': [{ key: 'slug', label: 'Term slug', placeholder: 'live-wait-time' }],
};

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
  const fields = WIDGET_FIELDS[selection.name] ?? [];
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

      {fields.map((f) => (
        <Section key={f.key} label={f.label}>
          <input
            value={attrs[f.key] ?? ''}
            onChange={(e) =>
              setAttrs((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder={f.placeholder}
            className="border-border/60 bg-background/60 text-foreground w-full rounded-lg border px-2.5 py-1.5 font-mono text-xs outline-none"
          />
        </Section>
      ))}

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

function widgetLabel(name: string): string {
  return name
    .replace(/-widget$/, '')
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ') + ' widget';
}

/**
 * Re-mount the image form on every new selection so its uncontrolled fields
 * pick up the new image cleanly without an in-effect setState dance.
 */
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

  const buildAltString = () => {
    const parts: string[] = [alt.trim()];
    if (caption.trim() || align !== 'center' || size) parts.push(caption.trim());
    if (align !== 'center' || size) parts.push(align);
    if (size) parts.push(size);
    return parts.join(' | ');
  };

  const save = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.setNodeAttribute(selection.pos, 'alt', buildAltString());
        return true;
      })
      .run();
    window.dispatchEvent(
      new CustomEvent('parkfan-selection', {
        detail: { ...selection, alt, caption, align, size: size || undefined },
      })
    );
  };
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
    window.dispatchEvent(
      new CustomEvent('parkfan-image-pick-request', {
        detail: { pos: selection.pos },
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
                onClick={() => setAlign(opt.k)}
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
              onClick={() => setSize(opt.k)}
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
  onClick: () => void;
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
