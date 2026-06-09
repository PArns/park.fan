'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderOpen, PenLine, Plus } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { FrontmatterForm } from './_components/frontmatter-form';
import { EditorCanvas } from './_components/editor-canvas';
import { MarkdownPreview } from './_components/markdown-preview';
import { SaveBar } from './_components/save-bar';
import { LocaleTabs } from './_components/locale-tabs';
import { PostPicker } from './_components/post-picker';
import { PropertiesPanel, type EditorSelection } from './_components/properties-panel';
import type { Editor } from '@tiptap/core';
import type { AuthorOption, CategoryOption, EditorInitialData } from './_lib/initial-data';
import type { EditorFrontmatter, LocaleDraft } from './_lib/types';
import type { NewAuthorDraft } from './_components/author-create-modal';
import type { NewCategoryDraft } from './_components/category-create-modal';
import { emptyDraft, isDraftFilled, slugify, toFrontmatter } from './_lib/types';

const DEFAULT_SOURCE: Locale = 'en';

export function BlogEditorClient({ initialData }: { initialData: EditorInitialData }) {
  const [sourceLocale, setSourceLocale] = useState<Locale>(DEFAULT_SOURCE);
  const [activeLocale, setActiveLocale] = useState<Locale>(DEFAULT_SOURCE);
  // One slice per locale. Created lazily when the user first edits that tab.
  const [drafts, setDrafts] = useState<Partial<Record<Locale, LocaleDraft>>>({
    [DEFAULT_SOURCE]: emptyDraft(),
  });
  const [translatingTarget, setTranslatingTarget] = useState<Locale | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [view, setView] = useState<'editor' | 'source'>('editor');
  /** Last clicked chip in the editor — drives the right-side PropertiesPanel.
   *  Stays sticky until the next chip is clicked so the author can flip back
   *  to the panel after typing. */
  const [selection, setSelection] = useState<EditorSelection>(null);
  /** Lifted TipTap editor instance so PropertiesPanel can run commands. */
  const [editor, setEditor] = useState<Editor | null>(null);

  // The ref-preview extension fires `parkfan-selection` from handleClick. We
  // listen at the top level so the panel reflects whichever chip was clicked
  // last, regardless of where in the canvas tree the event originated.
  useEffect(() => {
    const onSelection = (e: Event) => {
      const detail = (e as CustomEvent<EditorSelection & { rect?: unknown }>).detail;
      if (!detail) return;
      setSelection(detail);
    };
    const onClear = () => setSelection(null);
    window.addEventListener('parkfan-selection', onSelection as EventListener);
    window.addEventListener('parkfan-clear-selection', onClear as EventListener);
    return () => {
      window.removeEventListener('parkfan-selection', onSelection as EventListener);
      window.removeEventListener('parkfan-clear-selection', onClear as EventListener);
    };
  }, []);

  const requestRefReplace = useCallback(() => {
    if (!selection || selection.kind !== 'ref') return;
    const value = selection.value;
    const isRide = value.startsWith('/parks/')
      ? value.slice('/parks/'.length).split('/').filter(Boolean).length >= 5
      : value.includes('/');
    window.dispatchEvent(
      new CustomEvent('parkfan-replace-ref-request', {
        detail: { pos: selection.pos, isRide },
      })
    );
    setSelection(null);
  }, [selection]);
  /** Authors / categories the user created in this session — get appended to
   *  the editor's pickers AND sent with the save payload so the resulting PR
   *  contains the new author file / categories.json patch. */
  const [newAuthors, setNewAuthors] = useState<NewAuthorDraft[]>([]);
  const [newCategories, setNewCategories] = useState<NewCategoryDraft[]>([]);
  /** Authors / categories the user *edited* (overwriting an existing entry).
   *  Distinct from the new-* lists because the server commits them with the
   *  existing file SHA (otherwise GitHub rejects the createOrUpdate call). */
  const [editedAuthors, setEditedAuthors] = useState<NewAuthorDraft[]>([]);
  const [editedCategories, setEditedCategories] = useState<NewCategoryDraft[]>([]);

  const authors: AuthorOption[] = useMemo(() => {
    const merged: AuthorOption[] = initialData.authors.map((a) => {
      const overwrite = editedAuthors.find((e) => e.key === a.key);
      return overwrite
        ? {
            key: overwrite.key,
            name: overwrite.name,
            ...(overwrite.avatar ? { avatar: overwrite.avatar } : {}),
            ...(overwrite.role ? { role: overwrite.role } : {}),
            ...(overwrite.location ? { location: overwrite.location } : {}),
            ...(overwrite.url ? { url: overwrite.url } : {}),
            ...(overwrite.bio ? { bio: overwrite.bio } : {}),
          }
        : a;
    });
    for (const a of newAuthors) {
      merged.push({
        key: a.key,
        name: a.name,
        ...(a.avatar ? { avatar: a.avatar } : {}),
        ...(a.role ? { role: a.role } : {}),
        ...(a.location ? { location: a.location } : {}),
        ...(a.url ? { url: a.url } : {}),
        ...(a.bio ? { bio: a.bio } : {}),
      });
    }
    return merged;
  }, [initialData.authors, newAuthors, editedAuthors]);
  const categories: CategoryOption[] = useMemo(() => {
    const merged: CategoryOption[] = initialData.categories.map((c) => {
      const overwrite = editedCategories.find((e) => e.path === c.path);
      return overwrite
        ? {
            path: overwrite.path,
            labelEn: overwrite.labels.en ?? c.labelEn,
            labelDe: overwrite.labels.de ?? overwrite.labels.en ?? c.labelDe,
            labels: overwrite.labels,
          }
        : c;
    });
    for (const c of newCategories) {
      merged.push({
        path: c.path,
        labelEn: c.labels.en ?? c.path,
        labelDe: c.labels.de ?? c.labels.en ?? c.path,
        labels: c.labels,
      });
    }
    return merged;
  }, [initialData.categories, newCategories, editedCategories]);
  /**
   * When non-null the editor is editing an existing post — saves go to the
   * same per-locale paths instead of creating fresh files. Holds the original
   * slug for every locale so a rename can delete the stale file on save.
   */
  const [editing, setEditing] = useState<{
    key: string;
    originalSlugs: Partial<Record<Locale, string>>;
  } | null>(null);

  const ensure = (locale: Locale): LocaleDraft => drafts[locale] ?? emptyDraft();
  const active = ensure(activeLocale);

  const patch = (locale: Locale, next: Partial<LocaleDraft>) => {
    setDrafts((prev) => {
      const current = prev[locale] ?? emptyDraft();
      return { ...prev, [locale]: { ...current, ...next } };
    });
  };

  const onFmChange = (next: EditorFrontmatter) => {
    const cur = ensure(activeLocale);
    // Auto-derive slug from the title for this locale until the user edits it.
    const nextSlug = cur.slugTouched ? cur.slug : slugify(next.title);
    patch(activeLocale, { fm: next, slug: nextSlug });
  };
  const onBodyChange = (md: string) => patch(activeLocale, { body: md });
  const onSlugChange = (s: string) => patch(activeLocale, { slug: s, slugTouched: true });

  const filled = useMemo<Record<string, boolean>>(() => {
    const out: Record<string, boolean> = {};
    for (const l of initialData.locales) {
      const d = drafts[l];
      out[l] = !!d && (isDraftFilled(d) || !!d.fm.title.trim() || !!d.body.trim());
    }
    return out;
  }, [drafts, initialData.locales]);

  /** The base slug used in the PR branch name + filenames where no per-locale slug is set. */
  const baseSlug = useMemo(() => {
    const src = drafts[sourceLocale];
    return src?.slug || slugify(src?.fm.title ?? '');
  }, [drafts, sourceLocale]);

  // Validation: at least the source locale must be filled and slugified.
  const disabledReason = useMemo(() => {
    const src = drafts[sourceLocale];
    if (!src) return `Fill the ${sourceLocale.toUpperCase()} (source) locale first.`;
    if (!src.fm.title.trim()) return 'A title is required.';
    if (!src.fm.authorKey) return 'Pick an author.';
    if (!src.fm.excerpt.trim()) return 'An excerpt is required (also used in cards + meta).';
    if (!src.body.trim()) return 'Write something before opening a PR.';
    if (!src.slug.trim() && !baseSlug) return 'Slug is empty.';
    return undefined;
  }, [drafts, sourceLocale, baseSlug]);

  const onCreateAuthor = useCallback((draft: NewAuthorDraft) => {
    setNewAuthors((prev) => (prev.find((a) => a.key === draft.key) ? prev : [...prev, draft]));
  }, []);
  const onEditAuthor = useCallback((draft: NewAuthorDraft) => {
    setEditedAuthors((prev) => {
      const rest = prev.filter((a) => a.key !== draft.key);
      return [...rest, draft];
    });
  }, []);
  const onEditCategory = useCallback((draft: NewCategoryDraft) => {
    setEditedCategories((prev) => {
      const rest = prev.filter((c) => c.path !== draft.path);
      return [...rest, draft];
    });
  }, []);
  const onCreateCategory = useCallback((draft: NewCategoryDraft) => {
    setNewCategories((prev) =>
      prev.find((c) => c.path === draft.path) ? prev : [...prev, draft]
    );
  }, []);

  const onSave = async () => {
    const perLocale: Record<string, { slug: string; frontmatter: ReturnType<typeof toFrontmatter>; body: string }> = {};
    for (const l of initialData.locales) {
      const d = drafts[l];
      if (!d) continue;
      if (!isDraftFilled(d)) continue;
      perLocale[l] = {
        slug: d.slug.trim() || baseSlug,
        frontmatter: toFrontmatter(d.fm),
        body: d.body,
      };
    }
    const res = await fetch('/api/admin/blog-editor/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseSlug,
        sourceLocale,
        perLocale,
        ...(editing
          ? {
              editing: { key: editing.key, originalSlugs: editing.originalSlugs },
            }
          : {}),
        ...(newAuthors.length ? { newAuthors } : {}),
        ...(newCategories.length ? { newCategories } : {}),
        ...(editedAuthors.length ? { editedAuthors } : {}),
        ...(editedCategories.length ? { editedCategories } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `${res.status}: ${text || res.statusText}` };
    }
    const data = (await res.json()) as { url: string; branch: string; committed: string[] };
    return {
      ok: true,
      url: data.url,
      message: `${data.committed.length} locale(s) → ${data.branch}`,
    };
  };

  const onLoadPost = async (key: string) => {
    setLoadingPost(true);
    try {
      const res = await fetch(`/api/admin/blog-editor/posts/${encodeURIComponent(key)}`);
      if (!res.ok) {
        alert(`Could not load post: ${res.status}`);
        return;
      }
      const data = (await res.json()) as {
        key: string;
        sourceLocale: Locale;
        baseSlug: string;
        perLocale: Partial<
          Record<Locale, { slug: string; fm: EditorFrontmatter; body: string }>
        >;
      };
      const nextDrafts: Partial<Record<Locale, LocaleDraft>> = {};
      const originalSlugs: Partial<Record<Locale, string>> = {};
      for (const [loc, entry] of Object.entries(data.perLocale)) {
        if (!entry) continue;
        nextDrafts[loc as Locale] = {
          fm: entry.fm,
          body: entry.body,
          slug: entry.slug,
          // Mark as touched so the auto-derive on title edits doesn't clobber
          // the original slug — authors that want to rename can edit the slug
          // field explicitly.
          slugTouched: true,
        };
        originalSlugs[loc as Locale] = entry.slug;
      }
      setDrafts(nextDrafts);
      setSourceLocale(data.sourceLocale);
      setActiveLocale(data.sourceLocale);
      setEditing({ key: data.key, originalSlugs });
      setPickerOpen(false);
    } catch (err) {
      alert(`Load failed: ${(err as Error).message}`);
    } finally {
      setLoadingPost(false);
    }
  };

  const onTranslate = async (target: Locale) => {
    const src = drafts[sourceLocale];
    if (!src || !isDraftFilled(src)) return;
    setTranslatingTarget(target);
    try {
      const res = await fetch('/api/admin/blog-editor/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceLocale,
          targetLocale: target,
          frontmatter: toFrontmatter(src.fm),
          body: src.body,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Translation failed: ${res.status} ${text}`);
        return;
      }
      const data = (await res.json()) as {
        title: string;
        excerpt: string;
        body: string;
        seoTitle?: string;
        seoDescription?: string;
      };
      // Carry over everything language-neutral from the source draft; replace
      // language-bound fields with the AI output.
      const baseFm = src.fm;
      const newFm: EditorFrontmatter = {
        ...baseFm,
        title: data.title,
        excerpt: data.excerpt,
        seoTitle: data.seoTitle ?? '',
        seoDescription: data.seoDescription ?? '',
      };
      patch(target, {
        fm: newFm,
        body: data.body,
        slug: slugify(data.title),
        slugTouched: false,
      });
      setActiveLocale(target);
    } finally {
      setTranslatingTarget(null);
    }
  };

  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <div className="from-primary/20 to-primary/5 text-primary flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <PenLine className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              Blog editor
            </h1>
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                editing
                  ? 'bg-amber-500/15 text-amber-500'
                  : 'bg-emerald-500/15 text-emerald-500',
              ].join(' ')}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  editing ? 'bg-amber-500' : 'bg-emerald-500'
                } animate-pulse`}
              />
              {editing ? 'editing' : 'new post'}
            </span>
            {editing && (
              <code className="bg-muted/60 text-foreground/80 truncate rounded-md px-2 py-0.5 font-mono text-xs">
                {editing.key}
              </code>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Write once → translate → open one PR against{' '}
            <code className="bg-muted/60 text-foreground/80 rounded px-1.5 py-0.5 font-mono">
              {initialData.repoOwner}/{initialData.repoName}@{initialData.baseBranch}
            </code>
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={loadingPost}
            className="border-border/70 hover:border-primary/60 hover:bg-primary/8 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            {loadingPost ? 'Loading…' : 'Open existing'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                if (!confirm('Discard current draft and start a new post?')) return;
                setDrafts({ [sourceLocale]: emptyDraft() });
                setEditing(null);
                setActiveLocale(sourceLocale);
              }}
              className="from-primary/15 to-primary/5 border-primary/30 text-primary hover:border-primary/60 inline-flex items-center gap-1.5 rounded-xl border bg-gradient-to-br px-3 py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              New post
            </button>
          )}
        </div>
      </header>

      <PostPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={onLoadPost}
      />

      <LocaleTabs
        locales={initialData.locales}
        active={activeLocale}
        source={sourceLocale}
        onActive={(l) => setActiveLocale(l as Locale)}
        onSource={(l) => setSourceLocale(l as Locale)}
        filled={filled}
        translatingTarget={translatingTarget}
        onTranslate={(t) => onTranslate(t as Locale)}
        translateDisabled={!drafts[sourceLocale] || !isDraftFilled(drafts[sourceLocale]!)}
        translateDisabledReason="Fill the source locale first."
      />

      <FrontmatterForm
        value={active.fm}
        onChange={onFmChange}
        authors={authors}
        categories={categories}
        allTags={initialData.tags}
        slug={active.slug || (sourceLocale === activeLocale ? baseSlug : '')}
        onSlugChange={onSlugChange}
        onCreateAuthor={onCreateAuthor}
        onCreateCategory={onCreateCategory}
        onEditAuthor={onEditAuthor}
        onEditCategory={onEditCategory}
      />

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="border-border/70 bg-muted/30 inline-flex items-center gap-1 rounded-xl border p-1 backdrop-blur">
            {(['editor', 'source'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setView(t)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                  view === t
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40',
                ].join(' ')}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    view === t ? 'bg-primary' : 'bg-muted-foreground/40'
                  }`}
                />
                {t === 'editor' ? 'Visual editor' : '.md source'}
              </button>
            ))}
          </div>
          <div className="text-muted-foreground hidden text-[10px] uppercase tracking-wider sm:flex sm:items-center sm:gap-2">
            <span>{active.body.length.toLocaleString()} chars</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{Math.max(1, active.body.split('\n').length)} lines</span>
          </div>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            {view === 'editor' ? (
              <EditorCanvas
                initialMarkdown={active.body}
                onMarkdownChange={onBodyChange}
                onEditorReady={setEditor}
              />
            ) : (
              <MarkdownPreview value={active.body} onChange={onBodyChange} />
            )}
          </div>
          <PropertiesPanel
            editor={editor}
            selection={selection}
            charCount={active.body.length}
            onReplaceRef={requestRefReplace}
          />
        </div>
      </div>

      <SaveBar onSave={onSave} disabled={!!disabledReason} disabledReason={disabledReason} />
    </div>
  );
}
