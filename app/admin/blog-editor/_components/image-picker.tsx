'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Folder, Image as ImageIcon, Search, X } from 'lucide-react';
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
  const visible = ql ? allFiltered : allFiltered.slice(0, displayLimit);
  const hiddenCount = allFiltered.length - visible.length;

  const groups = new Map<string, BlogImage[]>();
  for (const i of visible) {
    const k = i.folder || '(root)';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(i);
  }

  const confirm = (src: string) => {
    if (withCaption) {
      // Stage the image; the author then fills alt/caption inline before
      // hitting Insert. Snappier than three prompt() dialogs.
      setStagedSrc(src);
      setAlt((prev) => prev || src.split('/').pop()?.replace(/\.[a-z]+$/i, '') || '');
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
            onClick={() => confirm(customUrl.trim())}
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {imgs.map((img) => {
                  const isStaged = stagedSrc === img.src;
                  return (
                    <button
                      key={img.src}
                      type="button"
                      onClick={() => confirm(img.src)}
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

        {withCaption && stagedSrc && (
          <div className="border-border/60 grid gap-2 border-t px-3 py-3 sm:grid-cols-2">
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
            <div className="sm:col-span-2 flex items-center justify-between">
              <span className="text-muted-foreground truncate font-mono text-[11px]">
                {stagedSrc}
              </span>
              <button
                type="button"
                onClick={commitStaged}
                className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-semibold"
              >
                Insert
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
