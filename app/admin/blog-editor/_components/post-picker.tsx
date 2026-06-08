'use client';

import { useEffect, useState } from 'react';
import { FileText, Folder, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostLocaleSummary {
  slug: string;
  title: string;
  mode: 'published' | 'hidden' | 'draft';
  date: string;
  updatedAt: string;
}

interface PostSummary {
  key: string;
  title: string;
  sourceLocale: string;
  locales: Record<string, PostLocaleSummary>;
  latestDate: string;
}

interface PostPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (key: string) => void;
}

/**
 * Modal listing every existing post (grouped by translationKey, newest first).
 * Same shell-pattern as the image picker — body unmounts when closed so each
 * open is a fresh state slice without breaking React 19's no-reset-in-effect.
 */
export function PostPicker(props: PostPickerProps) {
  if (!props.open) return null;
  return <PostPickerBody {...props} />;
}

function PostPickerBody({ onClose, onPick }: Omit<PostPickerProps, 'open'>) {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/admin/blog-editor/posts', { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { posts?: PostSummary[] }) => setPosts(data.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  const ql = q.trim().toLowerCase();
  const filtered = ql
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(ql) ||
          p.key.toLowerCase().includes(ql) ||
          Object.values(p.locales).some((l) => l.slug.toLowerCase().includes(ql))
      )
    : posts;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground flex max-h-[78vh] w-[min(720px,92vw)] flex-col overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
            placeholder="Search by title, translation key, or slug…"
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

        <div className="flex-1 overflow-y-auto p-2">
          {!loading && filtered.length === 0 && (
            <div className="text-muted-foreground p-8 text-center text-sm">
              <FileText className="mx-auto mb-2 h-6 w-6 opacity-40" />
              {posts.length === 0 ? 'No posts yet.' : 'No matches.'}
            </div>
          )}
          <ul className="divide-border/40 divide-y">
            {filtered.map((post) => {
              const localeBadges = Object.entries(post.locales).sort(([a], [b]) =>
                a.localeCompare(b)
              );
              return (
                <li key={post.key}>
                  <button
                    type="button"
                    onClick={() => onPick(post.key)}
                    className="hover:bg-accent/40 group flex w-full flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-foreground/95 truncate text-sm font-semibold">
                        {post.title}
                      </div>
                      <div className="text-muted-foreground/70 shrink-0 font-mono text-[10px]">
                        {post.latestDate}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <code className="text-muted-foreground/70 group-hover:text-muted-foreground inline-flex items-center gap-1 font-mono text-[10px]">
                        <Folder className="h-3 w-3" />
                        {post.key}
                      </code>
                      {localeBadges.map(([loc, summary]) => (
                        <span
                          key={loc}
                          title={`${loc}: ${summary.slug}`}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                            summary.mode === 'published'
                              ? 'border-primary/30 bg-primary/15 text-primary'
                              : summary.mode === 'draft'
                                ? 'border-yellow-500/30 bg-yellow-500/15 text-yellow-500'
                                : 'border-muted-foreground/30 bg-muted/40 text-muted-foreground'
                          )}
                        >
                          {loc}
                          {summary.mode !== 'published' && (
                            <span className="opacity-70">· {summary.mode}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
