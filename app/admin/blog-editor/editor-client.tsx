'use client';

import { useMemo, useState } from 'react';
import { PenLine } from 'lucide-react';
import type { Locale } from '@/i18n/config';
import { FrontmatterForm } from './_components/frontmatter-form';
import { EditorCanvas } from './_components/editor-canvas';
import { MarkdownPreview } from './_components/markdown-preview';
import { SaveBar } from './_components/save-bar';
import { LocaleTabs } from './_components/locale-tabs';
import type { EditorInitialData } from './_lib/initial-data';
import {
  emptyDraft,
  isDraftFilled,
  slugify,
  toFrontmatter,
  type EditorFrontmatter,
  type LocaleDraft,
} from './_lib/types';

const DEFAULT_SOURCE: Locale = 'en';

export function BlogEditorClient({ initialData }: { initialData: EditorInitialData }) {
  const [sourceLocale, setSourceLocale] = useState<Locale>(DEFAULT_SOURCE);
  const [activeLocale, setActiveLocale] = useState<Locale>(DEFAULT_SOURCE);
  // One slice per locale. Created lazily when the user first edits that tab.
  const [drafts, setDrafts] = useState<Partial<Record<Locale, LocaleDraft>>>({
    [DEFAULT_SOURCE]: emptyDraft(),
  });
  const [translatingTarget, setTranslatingTarget] = useState<Locale | null>(null);

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
      body: JSON.stringify({ baseSlug, sourceLocale, perLocale }),
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
        <div className="bg-primary/15 text-primary flex h-9 w-9 items-center justify-center rounded-xl">
          <PenLine className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-xl font-semibold tracking-tight text-transparent">
            Blog editor
          </h1>
          <p className="text-muted-foreground text-xs">
            Write once → translate → open one PR against{' '}
            <code className="bg-muted/60 rounded px-1.5 py-0.5 font-mono">
              {initialData.repoOwner}/{initialData.repoName}@{initialData.baseBranch}
            </code>
          </p>
        </div>
      </header>

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
        authors={initialData.authors}
        categories={initialData.categories}
        allTags={initialData.tags}
        slug={active.slug || (sourceLocale === activeLocale ? baseSlug : '')}
        onSlugChange={onSlugChange}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,42%)]">
        <EditorCanvas initialMarkdown={active.body} onMarkdownChange={onBodyChange} />
        <MarkdownPreview value={active.body} />
      </div>

      <SaveBar onSave={onSave} disabled={!!disabledReason} disabledReason={disabledReason} />
    </div>
  );
}
