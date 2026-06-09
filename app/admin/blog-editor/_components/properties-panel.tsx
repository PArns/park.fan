'use client';

import { useState } from 'react';
import {
  ExternalLink,
  Link as LinkIcon,
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
            {selection.kind === 'ref' ? 'ref chip' : 'link'}
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
  };
  const removeLink = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .run();
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
      return;
    }
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .setMark('link', { href: trimmed })
      .run();
  };
  const remove = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: selection.from, to: selection.to })
      .unsetMark('link')
      .run();
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
