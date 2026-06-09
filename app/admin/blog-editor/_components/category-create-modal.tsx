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
  onClose: () => void;
  onCreate: (draft: NewCategoryDraft) => void;
}

const LOCALES = ['en', 'de', 'nl', 'fr', 'es', 'it'] as const;

/**
 * Modal that captures a new category entry for content/blog/categories.json.
 * Authors pick an optional parent category — the saved key is
 * `<parent>/<slug>` — and supply localised labels. Only English is required;
 * the others fall back to English when blank.
 */
export function CategoryCreateModal({ open, existing, onClose, onCreate }: Props) {
  const [parent, setParent] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [otherLabels, setOtherLabels] = useState<Record<string, string>>({});

  if (!open) return null;

  const derivedSlug = slugTouched ? slug : slugify(labelEn);
  const fullPath = parent ? `${parent}/${derivedSlug}` : derivedSlug;
  const existingKeys = new Set(existing.map((c) => c.path));
  const collision = !!derivedSlug && existingKeys.has(fullPath);
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
    onCreate({ path: fullPath, labels });
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
            New (sub-)category
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
          <Field label="Parent category">
            <select
              value={parent}
              onChange={(e) => setParent(e.target.value)}
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
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
                collision
                  ? `${fullPath} already exists.`
                  : `Full path: ${fullPath || '(needs slug)'}`
              }
              error={collision}
            >
              <input
                value={derivedSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="disney-world"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 font-mono text-xs outline-none"
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
            Create category
          </button>
        </div>
      </div>
    </div>
  );
}

