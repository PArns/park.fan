'use client';

import { useState } from 'react';
import { CalendarDays, Check, Image as ImageIcon, Plus, Sparkles, Tag, X } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { AuthorOption, CategoryOption } from '../_lib/initial-data';
import type { EditorFrontmatter } from '../_lib/types';
import { AuthorCreateModal, type NewAuthorDraft } from './author-create-modal';
import {
  CategoryCreateModal,
  type NewCategoryDraft,
} from './category-create-modal';
import { DatePop } from './date-pop';
import { ImagePicker } from './image-picker';

interface FrontmatterFormProps {
  value: EditorFrontmatter;
  onChange: (next: EditorFrontmatter) => void;
  authors: AuthorOption[];
  categories: CategoryOption[];
  allTags: string[];
  slug: string;
  onSlugChange: (s: string) => void;
  /** Bubbles a brand-new author up to the parent so it can be appended to the
   *  authors list AND included in the save PR. */
  onCreateAuthor?: (draft: NewAuthorDraft) => void;
  /** Same flow for a new (sub-)category. */
  onCreateCategory?: (draft: NewCategoryDraft) => void;
}

/**
 * Notion-style page properties block. Big title + subtitle, then a compact grid
 * of pills/dropdowns for the rest. The active locale is controlled outside this
 * component (see LocaleTabs); only fields scoped to the active locale live here.
 */
export function FrontmatterForm({
  value,
  onChange,
  authors,
  categories,
  allTags,
  slug,
  onSlugChange,
  onCreateAuthor,
  onCreateCategory,
}: FrontmatterFormProps) {
  const set = <K extends keyof EditorFrontmatter>(k: K, v: EditorFrontmatter[K]) =>
    onChange({ ...value, [k]: v });
  const author = authors.find((a) => a.key === value.authorKey);
  const [authorModalOpen, setAuthorModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  return (
    <div className="mb-6 space-y-4">
      {/* Title & summary card — gives the post identity its own breathing room. */}
      <div className="border-border/60 bg-card/40 group relative overflow-hidden rounded-2xl border p-7 backdrop-blur-sm">
        <div className="from-primary/8 via-primary/0 to-primary/3 pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50" />
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <SlugChip value={slug} onChange={onSlugChange} />
          </div>
          <textarea
            value={value.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Untitled"
            rows={1}
            className="placeholder:text-muted-foreground/40 mb-2 w-full resize-none bg-transparent text-4xl font-bold tracking-tight outline-none"
            style={{ minHeight: '3rem' }}
          />
          <textarea
            value={value.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="One or two sentences for cards and meta description."
            rows={2}
            className="text-muted-foreground placeholder:text-muted-foreground/40 w-full resize-none bg-transparent text-lg leading-snug outline-none"
          />
        </div>
      </div>

      {/* Properties card — Notion-style page properties grid. */}
      <div className="border-border/60 bg-card/30 rounded-2xl border p-5 backdrop-blur-sm">
        <div className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="bg-primary/40 h-1 w-1 rounded-full" />
          Page properties
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
        <AuthorPicker
          authors={authors}
          value={value.authorKey}
          onChange={(k) => {
            if (k === '__new__') {
              setAuthorModalOpen(true);
              return;
            }
            set('authorKey', k);
          }}
          selected={author}
          canCreate={!!onCreateAuthor}
        />
        <CategoryPicker
          categories={categories}
          value={value.category}
          onChange={(p) => {
            if (p === '__new__') {
              setCategoryModalOpen(true);
              return;
            }
            set('category', p);
          }}
          canCreate={!!onCreateCategory}
        />
        <DatePop label="Date" value={value.date} onChange={(d) => set('date', d)} />
        <DatePop
          label="Updated"
          value={value.updatedAt}
          onChange={(d) => set('updatedAt', d)}
          allowClear
        />
        <ModePicker value={value.mode} onChange={(m) => set('mode', m)} />
        <FeaturedToggle value={value.featured} onChange={(b) => set('featured', b)} />
        </div>

        <div className="border-border/40 mt-5 border-t pt-4">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="bg-primary/40 h-1 w-1 rounded-full" />
            Tags
          </div>
          <TagChips
            value={value.tags}
            onChange={(t) => set('tags', t)}
            suggestions={allTags}
          />
        </div>

        <details className="group mt-4 border-border/40 border-t pt-4">
          <summary className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold transition-colors">
            <Plus className="h-3.5 w-3.5 transition-transform group-open:rotate-45" />
            Cover image & SEO
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <CoverPicker
            src={value.coverSrc}
            onChange={(v) => set('coverSrc', v)}
          />
          <Field
            label="Cover alt"
            value={value.coverAlt}
            onChange={(v) => set('coverAlt', v)}
          />
          <Field
            label="SEO title"
            value={value.seoTitle}
            onChange={(v) => set('seoTitle', v)}
          />
          <Field
            label="SEO description"
            value={value.seoDescription}
            onChange={(v) => set('seoDescription', v)}
          />
          </div>
        </details>
      </div>

      {onCreateAuthor && (
        <AuthorCreateModal
          open={authorModalOpen}
          existing={new Set(authors.map((a) => a.key))}
          onClose={() => setAuthorModalOpen(false)}
          onCreate={(draft) => {
            onCreateAuthor(draft);
            set('authorKey', draft.key);
            setAuthorModalOpen(false);
          }}
        />
      )}
      {onCreateCategory && (
        <CategoryCreateModal
          open={categoryModalOpen}
          existing={categories}
          onClose={() => setCategoryModalOpen(false)}
          onCreate={(draft) => {
            onCreateCategory(draft);
            set('category', draft.path);
            setCategoryModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SlugChip({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  return (
    <div className="bg-muted/40 text-muted-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 font-mono text-[11px]">
      <span className="opacity-60">slug</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-foreground w-56 bg-transparent outline-none"
        spellCheck={false}
      />
    </div>
  );
}

function AuthorPicker({
  authors,
  value,
  onChange,
  selected,
  canCreate,
}: {
  authors: AuthorOption[];
  value: string;
  onChange: (k: string) => void;
  selected: AuthorOption | undefined;
  canCreate?: boolean;
}) {
  return (
    <label className="border-border/60 hover:border-border bg-background/60 group flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors">
      <div className="bg-primary/15 text-primary relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold">
        {selected?.avatar ? (
          <Image src={selected.avatar} alt={selected.name} fill className="object-cover" />
        ) : (
          (selected?.name ?? '?').charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Author
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-foreground w-full appearance-none bg-transparent text-sm font-medium outline-none"
        >
          <option value="">— pick author —</option>
          {authors.map((a) => (
            <option key={a.key} value={a.key}>
              {a.name}
            </option>
          ))}
          {canCreate && <option value="__new__">+ New author…</option>}
        </select>
      </div>
    </label>
  );
}

function CategoryPicker({
  categories,
  value,
  onChange,
  canCreate,
}: {
  categories: CategoryOption[];
  value: string;
  onChange: (p: string) => void;
  canCreate?: boolean;
}) {
  return (
    <label className="border-border/60 hover:border-border bg-background/60 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors">
      <div className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        <Tag className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Category
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-foreground w-full appearance-none bg-transparent text-sm font-medium outline-none"
        >
          <option value="">— none —</option>
          {categories.map((c) => (
            <option key={c.path} value={c.path}>
              {c.labelEn} · {c.path}
            </option>
          ))}
          {canCreate && <option value="__new__">+ New (sub-)category…</option>}
        </select>
      </div>
    </label>
  );
}

function ModePicker({
  value,
  onChange,
}: {
  value: 'published' | 'hidden' | 'draft';
  onChange: (m: 'published' | 'hidden' | 'draft') => void;
}) {
  const options: Array<{ k: 'published' | 'hidden' | 'draft'; label: string; tone: string }> = [
    { k: 'draft', label: 'Draft', tone: 'bg-muted text-muted-foreground' },
    { k: 'hidden', label: 'Hidden', tone: 'bg-amber-500/15 text-amber-500' },
    { k: 'published', label: 'Published', tone: 'bg-emerald-500/15 text-emerald-500' },
  ];
  return (
    <div className="border-border/60 bg-background/60 flex items-center gap-3 rounded-xl border px-3 py-2">
      <div className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        <Check className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Mode
        </div>
        <div className="flex gap-1">
          {options.map((o) => (
            <button
              key={o.k}
              type="button"
              onClick={() => onChange(o.k)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity',
                o.tone,
                value === o.k ? 'opacity-100' : 'opacity-50 hover:opacity-80'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedToggle({ value, onChange }: { value: boolean; onChange: (b: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
        value
          ? 'border-primary/40 bg-primary/10'
          : 'border-border/60 bg-background/60 hover:border-border'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          value ? 'bg-primary/25 text-primary' : 'bg-primary/15 text-primary'
        )}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Featured
        </div>
        <div className="text-foreground text-sm font-medium">{value ? 'Yes' : 'No'}</div>
      </div>
    </button>
  );
}

function TagChips({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState('');
  const cleanedDraft = draft.trim().toLowerCase();
  const matchesExisting =
    cleanedDraft !== '' &&
    suggestions.some((s) => s === cleanedDraft) === false &&
    value.includes(cleanedDraft) === false;
  const available = suggestions.filter(
    (s) => !value.includes(s) && (!cleanedDraft || s.toLowerCase().includes(cleanedDraft))
  );
  const add = (t: string) => {
    const cleaned = t.trim().toLowerCase();
    if (!cleaned || value.includes(cleaned)) return;
    onChange([...value, cleaned]);
    setDraft('');
  };
  const remove = (t: string) => onChange(value.filter((x) => x !== t));

  return (
    <div>
      <div className="text-muted-foreground/70 mb-1.5 text-right text-[10px]">
        Type to search · press <kbd className="bg-muted rounded px-1 py-0.5 font-mono">Enter</kbd>{' '}
        to add a new one
      </div>
      <div className="border-border/60 bg-background/60 flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2">
        {value.map((t) => (
          <span
            key={t}
            className="bg-primary/15 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          >
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="hover:bg-primary/25 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${t}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder={value.length ? '+ tag' : 'Type a tag, press Enter to add'}
          className="text-foreground min-w-[8rem] flex-1 bg-transparent text-sm outline-none"
        />
        {matchesExisting && (
          <button
            type="button"
            onClick={() => add(draft)}
            className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
          >
            <Plus className="h-3 w-3" /> add &ldquo;{cleanedDraft}&rdquo;
          </button>
        )}
      </div>
      {available.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {available.slice(0, 14).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-full px-2 py-0.5 text-[11px] transition-colors"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CoverPicker({
  src,
  onChange,
}: {
  src: string;
  onChange: (s: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border/60 hover:border-border bg-background/60 group flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors"
      >
        <div className="bg-primary/15 text-primary relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
          {src ? (
            <Image
              src={src}
              alt="Cover"
              fill
              sizes="48px"
              className="object-cover"
              unoptimized={src.endsWith('.svg') || src.startsWith('http')}
            />
          ) : (
            <ImageIcon className="absolute inset-0 m-auto h-4 w-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
            Cover image
          </div>
          <div
            className={cn(
              'truncate text-sm',
              src ? 'text-foreground font-medium' : 'text-muted-foreground/60'
            )}
          >
            {src || 'Pick an image…'}
          </div>
        </div>
      </button>
      <ImagePicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(r) => onChange(r.src)}
      />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: typeof CalendarDays;
}) {
  return (
    <label className="border-border/60 hover:border-border bg-background/60 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 transition-colors">
      {Icon && (
        <div className="bg-primary/15 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="text-foreground placeholder:text-muted-foreground/40 w-full bg-transparent text-sm outline-none"
        />
      </div>
    </label>
  );
}
