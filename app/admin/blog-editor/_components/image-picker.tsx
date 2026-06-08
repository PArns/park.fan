'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

function ImagePickerBody({ onClose, onPick, withCaption }: Omit<ImagePickerProps, 'open'>) {
  const [images, setImages] = useState<BlogImage[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [stagedSrc, setStagedSrc] = useState<string | null>(null);
  const [view, setView] = useState<View>('grid');
  // Render in chunks so the modal stays cheap even with thousands of images.
  // Search bypasses this — typed queries already filter the list down hard.
  const STEP = 60;
  const [displayLimit, setDisplayLimit] = useState(STEP);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/admin/blog-editor/images', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { images?: BlogImage[] }) => setImages(data.images ?? []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const ql = q.trim().toLowerCase();
  const allFiltered = ql ? images.filter((i) => i.src.toLowerCase().includes(ql)) : images;
  // No cap while searching — matches are usually a handful and the user is hunting.
  // List view rows are cheap, so we lift the cap there as well.
  const capped = ql || view === 'list' ? allFiltered : allFiltered.slice(0, displayLimit);
  const visible = capped;
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
    if (view === 'list' || withCaption) {
      setStagedSrc(src);
      setAlt(
        (prev) => prev || src.split('/').pop()?.replace(/\.[a-z]+$/i, '') || ''
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[8vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground flex max-h-[85vh] w-[min(900px,92vw)] flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            placeholder="Search images under /blog/images…"
            className="text-foreground flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
          />
          {loading && <span className="text-muted-foreground text-xs">loading…</span>}
          <div className="bg-muted/40 inline-flex overflow-hidden rounded-md p-0.5">
            <ViewBtn
              active={view === 'grid'}
              onClick={() => setView('grid')}
              label="Grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </ViewBtn>
            <ViewBtn
              active={view === 'list'}
              onClick={() => setView('list')}
              label="List"
            >
              <ListIcon className="h-3.5 w-3.5" />
            </ViewBtn>
          </div>
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
            className="text-foreground flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
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

        <div className="flex-1 overflow-y-auto p-3">
          {!loading && allFiltered.length === 0 && (
            <div className="text-muted-foreground p-8 text-center text-sm">
              <ImageIcon className="mx-auto mb-2 h-6 w-6 opacity-40" />
              {images.length === 0
                ? 'No images under /public/blog/images yet.'
                : 'No matches.'}
            </div>
          )}
          {Array.from(groups.entries()).map(([folder, imgs]) => (
            <div key={folder} className="mb-4 last:mb-0">
              <div className="text-muted-foreground mb-2 inline-flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider">
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
                            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                            isStaged
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-accent/40'
                          )}
                        >
                          <ImageIcon className="text-muted-foreground/70 h-3.5 w-3.5 shrink-0" />
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
          {hiddenCount > 0 && view === 'grid' && (
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
            <div className="bg-muted relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border/60">
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
