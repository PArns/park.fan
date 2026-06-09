'use client';

import { useState } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '../_lib/types';
import type { CategoryOption } from '../_lib/initial-data';
import { Field } from './form-fields';

export interface NewCategoryDraft {
  path: string;
  /** Locale -> label. en is required, others fall back to en if blank. */
  labels: Record<string, string>;
}

interface Props {
  open: boolean;
  /** Existing categories so we can offer them as a parent + prevent collisions. */
  existing: CategoryOption[];
  /** When set, opens in Edit mode — path locked, labels pre-filled. */
  initial?: NewCategoryDraft;
  onClose: () => void;
  onSubmit: (draft: NewCategoryDraft) => void;
}

const LOCALES = ['en', 'de', 'nl', 'fr', 'es', 'it'] as const;

/**
 * Captures a category entry for content/blog/categories.json — create OR
 * edit. In edit mode the parent + slug halves of the path are locked
 * (renaming would also need to migrate every post that points at the old
 * path, which is out of scope here).
 */
export function CategoryCreateModal({
  open,
  existing,
  initial,
  onClose,
  onSubmit,
}: Props) {
  return open ? (
    <CategoryForm
      key={initial?.path ?? 'create'}
      existing={existing}
      initial={initial}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  ) : null;
}

function CategoryForm({
  existing,
  initial,
  onClose,
  onSubmit,
}: {
  existing: CategoryOption[];
  initial?: NewCategoryDraft;
  onClose: () => void;
  onSubmit: (draft: NewCategoryDraft) => void;
}) {
  const isEdit = !!initial;
  const initialParts = initial?.path.split('/') ?? [];
  const initialParent = initialParts.length > 1 ? initialParts.slice(0, -1).join('/') : '';
  const initialSlug = initialParts.length ? initialParts[initialParts.length - 1] : '';
  const [parent, setParent] = useState(initialParent);
  const [labelEn, setLabelEn] = useState(initial?.labels.en ?? '');
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [otherLabels, setOtherLabels] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const [loc, label] of Object.entries(initial?.labels ?? {})) {
      if (loc !== 'en' && label) out[loc] = label;
    }
    return out;
  });

  const derivedSlug = isEdit ? initialSlug : slugTouched ? slug : slugify(labelEn);
  const fullPath = isEdit
    ? initial!.path
    : parent
      ? `${parent}/${derivedSlug}`
      : derivedSlug;
  const existingKeys = new Set(existing.map((c) => c.path));
  const collision = !isEdit && !!derivedSlug && existingKeys.has(fullPath);
  const valid =
    !!labelEn.trim() &&
    !!derivedSlug &&
    /^[a-z0-9][a-z0-9-]*$/.test(derivedSlug) &&
    !collision;

  const submit = () => {
    if (!valid) return;
    const labels: Record<string, string> = { en: labelEn.trim() };
    for (const loc of LOCALES) {
      if (loc === 'en') continue;
      const v = otherLabels[loc]?.trim();
      if (v) labels[loc] = v;
    }
    onSubmit({ path: fullPath, labels });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground w-[min(580px,92vw)] overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
          <FolderPlus className="text-primary h-4 w-4" />
          <div className="text-foreground/95 flex-1 text-sm font-semibold">
            {isEdit ? `Edit category · ${initial!.path}` : 'New (sub-)category'}
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

        <div className="grid gap-3 px-4 py-3">
          <Field
            label="Parent category"
            hint={isEdit ? 'Locked while editing.' : undefined}
          >
            <select
              value={parent}
              disabled={isEdit}
              onChange={(e) => setParent(e.target.value)}
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">— top-level —</option>
              {existing.map((c) => (
                <option key={c.path} value={c.path}>
                  {c.labelEn} · {c.path}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="English label">
              <input
                autoFocus
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="Disney World"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field
              label="Slug"
              hint={
                isEdit
                  ? 'Locked while editing.'
                  : collision
                    ? `${fullPath} already exists.`
                    : `Full path: ${fullPath || '(needs slug)'}`
              }
              error={collision}
            >
              <input
                value={derivedSlug}
                disabled={isEdit}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="disney-world"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 font-mono text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
          </div>
          <Field
            label="Other locales (optional)"
            hint="Empty = uses English label as fallback."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {LOCALES.filter((l) => l !== 'en').map((loc) => (
                <label key={loc} className="grid gap-1">
                  <span className="text-muted-foreground/70 text-[9px] font-bold uppercase">
                    {loc}
                  </span>
                  <input
                    value={otherLabels[loc] ?? ''}
                    onChange={(e) =>
                      setOtherLabels((prev) => ({ ...prev, [loc]: e.target.value }))
                    }
                    placeholder={labelEn || loc.toUpperCase()}
                    className="bg-background/60 border-border/60 text-foreground rounded-md border px-2 py-1 text-xs outline-none"
                  />
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="border-border/60 bg-muted/20 flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={submit}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              valid
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isEdit ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </div>
    </div>
  );
}

