'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { addPendingImage } from '../_lib/pending-images';
import { ADMIN_PASS_HEADER, useAdmin } from '../../_lib/admin-context';

interface BlogImage {
  src: string;
  folder: string;
  name: string;
  mtime?: number;
}

export interface ImagePickResult {
  src: string;
  alt: string;
  caption: string;
}

interface ImagePickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (r: ImagePickResult) => void;
  /** When set, the dialog also collects alt + caption (used for inline insertions). */
  withCaption?: boolean;
  /** "Pick…" from a panel — a single click should commit the new src
   *  immediately, without staging for caption-entry. */
  replaceMode?: boolean;
  /** Bounding rect of the chip that triggered the picker so the modal can
   *  anchor near it instead of always floating at the top of the viewport. */
  anchorRect?: { top: number; bottom: number; left: number; right: number };
}

type View = 'grid' | 'list';

/**
 * Thin shell that unmounts the body when `open` is false, so each opening gets
 * a fresh state slice without reaching for a state-reset effect (which React 19
 * forbids).
 */
export function ImagePicker(props: ImagePickerProps) {
  if (!props.open) return null;
  return <ImagePickerBody {...props} />;
}

function ImagePickerBody({
  onClose,
  onPick,
  withCaption,
  replaceMode,
  anchorRect,
}: Omit<ImagePickerProps, 'open'>) {
  const { pass } = useAdmin();
  const [images, setImages] = useState<BlogImage[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [stagedSrc, setStagedSrc] = useState<string | null>(null);
  const [view, setView] = useState<View>('grid');
  const searchRef = useRef<HTMLInputElement>(null);
  // Focus the search box without `autoFocus` — the default-focus behaviour
  // (focus on mount) calls .focus() WITHOUT `preventScroll`, which on some
  // pages yanks the document up to bring the (already-visible, fixed-
  // positioned) input "into view". preventScroll keeps the viewport pinned.
  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);
  // Render in chunks so the modal stays cheap even with thousands of images.
  // Search bypasses this — typed queries already filter the list down hard.
  const STEP = 60;
  const [displayLimit, setDisplayLimit] = useState(STEP);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/admin/blog-editor/images', {
      signal: ctrl.signal,
      headers: { [ADMIN_PASS_HEADER]: pass },
    })
      .then((r) => r.json())
      .then((data: { images?: BlogImage[] }) => setImages(data.images ?? []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [pass]);

  const ql = q.trim().toLowerCase();
  const allFiltered = ql ? images.filter((i) => i.src.toLowerCase().includes(ql)) : images;
  // No cap while searching — matches are usually a handful and the user is
  // hunting. Both views paginate otherwise: list rows carry thumbnails now,
  // so a thousand-image library would mount a thousand <Image>s without it.
  const visible = ql ? allFiltered : allFiltered.slice(0, displayLimit);
  const hiddenCount = allFiltered.length - visible.length;

  const groups = new Map<string, BlogImage[]>();
  for (const i of visible) {
    const k = i.folder || '(root)';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(i);
  }

  /** What "clicking an image" does — grid view inserts straight away unless we
   *  need caption text; list view always stages so the author can preview the
   *  rendered image before committing. */
  const onItemClick = (src: string) => {
    // Replace flow short-circuits caption staging — the panel already owns
    // alt/caption, the picker only swaps the underlying src.
    if (replaceMode) {
      onPick({ src, alt: '', caption: '' });
      onClose();
      return;
    }
    if (view === 'list' || withCaption) {
      setStagedSrc(src);
      setAlt(
        (prev) =>
          prev ||
          src
            .split('/')
            .pop()
            ?.replace(/\.[a-z]+$/i, '') ||
          ''
      );
      return;
    }
    onPick({ src, alt: '', caption: '' });
    onClose();
  };

  const commitStaged = () => {
    if (!stagedSrc) return;
    onPick({ src: stagedSrc, alt: alt.trim(), caption: caption.trim() });
    onClose();
  };

  // Anchor positioning — when the panel hands us the triggering chip's rect
  // we float the modal near it instead of always at the top of the viewport.
  // Picks the side with more room so the dialog never escapes the screen.
  const DIALOG_HEIGHT = Math.min(640, window.innerHeight * 0.85);
  let modalStyle: React.CSSProperties = {};
  if (anchorRect) {
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const spaceAbove = anchorRect.top;
    const placeBelow = spaceBelow >= 360 || spaceBelow >= spaceAbove;
    const top = placeBelow
      ? Math.min(anchorRect.bottom + 12, window.innerHeight - DIALOG_HEIGHT - 16)
      : Math.max(16, anchorRect.top - DIALOG_HEIGHT - 12);
    modalStyle = {
      position: 'fixed',
      top,
      left: Math.max(
        16,
        Math.min(window.innerWidth - 16 - 720, (anchorRect.left + anchorRect.right) / 2 - 360)
      ),
      width: 'min(720px, 92vw)',
      maxHeight: DIALOG_HEIGHT,
    };
  }

  return (
    <div
      className={
        anchorRect
          ? 'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm'
          : 'fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[8vh] backdrop-blur-sm'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={modalStyle}
        className={
          'border-border/60 bg-popover text-popover-foreground flex flex-col overflow-hidden rounded-2xl border shadow-2xl ' +
          (anchorRect ? '' : 'max-h-[85vh] w-[min(900px,92vw)]')
        }
      >
        <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search images under /blog/images…"
            className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-base outline-none"
          />
          {loading && <span className="text-muted-foreground text-xs">loading…</span>}
          <div className="bg-muted/40 inline-flex overflow-hidden rounded-md p-0.5">
            <ViewBtn active={view === 'grid'} onClick={() => setView('grid')} label="Grid">
              <LayoutGrid className="h-3.5 w-3.5" />
            </ViewBtn>
            <ViewBtn active={view === 'list'} onClick={() => setView('list')} label="List">
              <ListIcon className="h-3.5 w-3.5" />
            </ViewBtn>
          </div>
          <label
            title="Upload an image — committed with the post's PR"
            className="hover:bg-accent/50 text-primary border-border/60 inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors"
          >
            <Upload className="h-3 w-3" />
            Upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const staged = await addPendingImage(file);
                  onPick({
                    src: staged.path,
                    alt: staged.name.replace(/\.[a-z0-9]+$/i, ''),
                    caption: '',
                  });
                  onClose();
                } catch (err) {
                  window.alert((err as Error).message);
                }
              }}
            />
          </label>
          <button
            type="button"
            onClick={onClose}
            className="hover:bg-accent/40 rounded-md p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
          <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="…or paste an external image URL"
            className="text-foreground placeholder:text-muted-foreground/50 flex-1 bg-transparent text-sm outline-none"
          />
          <button
            type="button"
            disabled={!customUrl.trim()}
            onClick={() => onItemClick(customUrl.trim())}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
              customUrl.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            Use URL
          </button>
        </div>

        <div className="editor-scroll flex-1 overflow-y-auto p-3">
          {!loading && allFiltered.length === 0 && (
            <div className="text-muted-foreground p-8 text-center text-sm">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 opacity-40" />
              {images.length === 0 ? 'No images under /public/blog/images yet.' : 'No matches.'}
            </div>
          )}
          {Array.from(groups.entries()).map(([folder, imgs]) => (
            <div key={folder} className="mb-4 last:mb-0">
              <div className="text-muted-foreground mb-2 inline-flex items-center gap-1 px-1 text-[10px] font-semibold tracking-wider uppercase">
                <Folder className="h-3 w-3" />
                {folder}
                <span className="opacity-60">· {imgs.length}</span>
              </div>
              {view === 'grid' ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {imgs.map((img) => {
                    const isStaged = stagedSrc === img.src;
                    return (
                      <button
                        key={img.src}
                        type="button"
                        onClick={() => onItemClick(img.src)}
                        className={cn(
                          'group bg-muted relative aspect-square overflow-hidden rounded-lg border transition-all',
                          isStaged
                            ? 'border-primary ring-primary/30 ring-2'
                            : 'border-border/60 hover:border-primary/60 hover:scale-[1.02]'
                        )}
                      >
                        <Image
                          src={img.src}
                          alt={img.name}
                          fill
                          sizes="200px"
                          className="object-cover"
                          loading="lazy"
                          unoptimized={img.src.endsWith('.svg')}
                        />
                        <div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-left text-[10px] text-white">
                          {img.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <ul className="divide-border/40 divide-y">
                  {imgs.map((img) => {
                    const isStaged = stagedSrc === img.src;
                    return (
                      <li key={img.src}>
                        <button
                          type="button"
                          onClick={() => onItemClick(img.src)}
                          className={cn(
                            'group/row flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors',
                            isStaged ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40'
                          )}
                        >
                          {/* Thumbnail instead of a generic icon — at list
                              scale you pick by PICTURE, not by filename.
                              Lazy-loaded so a thousand-row list stays cheap. */}
                          <span className="border-border/50 bg-muted relative h-10 w-14 shrink-0 overflow-hidden rounded-md border">
                            <Image
                              src={img.src}
                              alt={img.name}
                              fill
                              sizes="56px"
                              className="object-cover transition-transform group-hover/row:scale-105"
                              loading="lazy"
                              unoptimized={img.src.endsWith('.svg')}
                            />
                          </span>
                          <span className="text-foreground/90 truncate text-sm">{img.name}</span>
                          <span className="text-muted-foreground/60 ml-auto truncate font-mono text-[11px]">
                            {img.src}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="mt-2 flex flex-col items-center gap-1 py-2">
              <button
                type="button"
                onClick={() => setDisplayLimit((d) => d + STEP)}
                className="border-border/60 hover:border-primary/60 hover:text-primary text-foreground/80 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors"
              >
                Load {Math.min(hiddenCount, STEP)} more
              </button>
              <span className="text-muted-foreground text-[10px]">
                {visible.length} of {allFiltered.length} shown
              </span>
            </div>
          )}
        </div>

        {stagedSrc && (
          <div className="border-border/60 bg-muted/20 flex flex-col gap-2 border-t px-3 py-3 sm:flex-row sm:items-start">
            <div className="bg-muted border-border/60 relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={stagedSrc}
                alt="Preview"
                fill
                sizes="120px"
                className="object-contain"
                unoptimized={stagedSrc.endsWith('.svg') || stagedSrc.startsWith('http')}
              />
            </div>
            <div className="grid flex-1 gap-2">
              {withCaption && (
                <>
                  <input
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="Alt text (required for screen readers)"
                    className="border-border/60 bg-background/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
                  />
                  <input
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption (optional)"
                    className="border-border/60 bg-background/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
                  />
                </>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground truncate font-mono text-[11px]">
                  {stagedSrc}
                </span>
                <div className="inline-flex gap-1">
                  <button
                    type="button"
                    onClick={() => setStagedSrc(null)}
                    className="text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commitStaged}
                    className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold"
                  >
                    Insert
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewBtn({
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
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded px-2 py-1 transition-colors',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
