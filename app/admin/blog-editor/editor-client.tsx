'use client';

import { useMemo, useState } from 'react';
import { PenLine } from 'lucide-react';
import { FrontmatterForm } from './_components/frontmatter-form';
import { EditorCanvas } from './_components/editor-canvas';
import { MarkdownPreview } from './_components/markdown-preview';
import { SaveBar } from './_components/save-bar';
import type { EditorInitialData } from './_lib/initial-data';
import {
  emptyFrontmatter,
  slugify,
  toFrontmatter,
  type EditorFrontmatter,
} from './_lib/types';

/**
 * Top-level editor: a Notion-style header (page properties) on top, then the
 * split-view body — TipTap canvas on the left, live `.md` source on the right.
 * Saving POSTs to /api/admin/blog-editor/save which opens a draft PR.
 */
export function BlogEditorClient({ initialData }: { initialData: EditorInitialData }) {
  const [fm, setFm] = useState<EditorFrontmatter>(() => emptyFrontmatter());
  const [body, setBody] = useState<string>('');
  const [locale, setLocale] = useState<string>('en');
  const [slug, setSlug] = useState<string>('');

  // Auto-slug from title until the author edits the slug field directly.
  const [slugTouched, setSlugTouched] = useState(false);
  const effectiveSlug = slug || (slugTouched ? '' : slugify(fm.title));

  const onTitle = (next: EditorFrontmatter) => {
    setFm(next);
    if (!slugTouched) setSlug(slugify(next.title));
  };

  const disabledReason = useMemo(() => {
    if (!fm.title.trim()) return 'A title is required.';
    if (!effectiveSlug) return 'Slug is empty — type a title or set one manually.';
    if (!fm.authorKey) return 'Pick an author.';
    if (!fm.excerpt.trim()) return 'An excerpt is required (used in cards and meta description).';
    if (!body.trim()) return 'Write something before opening a PR.';
    return undefined;
  }, [fm, effectiveSlug, body]);

  const onSave = async () => {
    const res = await fetch('/api/admin/blog-editor/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locale,
        slug: effectiveSlug,
        frontmatter: toFrontmatter(fm),
        body,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, message: `${res.status}: ${text || res.statusText}` };
    }
    const data = (await res.json()) as { url: string; branch: string };
    return { ok: true, url: data.url, message: `Branch ${data.branch}` };
  };

  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-6">
      <header className="mb-4 flex items-center gap-2">
        <PenLine className="text-primary h-5 w-5" />
        <h1 className="text-foreground text-xl font-semibold tracking-tight">Blog editor</h1>
        <span className="text-muted-foreground text-xs">
          New post → write → open PR against{' '}
          <code className="bg-muted rounded px-1.5 py-0.5">
            {initialData.repoOwner}/{initialData.repoName}@{initialData.baseBranch}
          </code>
        </span>
      </header>

      <FrontmatterForm
        value={fm}
        onChange={onTitle}
        authors={initialData.authors}
        categories={initialData.categories}
        allTags={initialData.tags}
        locales={initialData.locales}
        locale={locale}
        onLocaleChange={setLocale}
        slug={effectiveSlug}
        onSlugChange={(v) => {
          setSlugTouched(true);
          setSlug(v);
        }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,42%)]">
        <EditorCanvas initialMarkdown={body} onMarkdownChange={setBody} />
        <MarkdownPreview value={body} />
      </div>

      <SaveBar onSave={onSave} disabled={!!disabledReason} disabledReason={disabledReason} />
    </div>
  );
}
