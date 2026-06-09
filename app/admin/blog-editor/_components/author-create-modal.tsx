'use client';

import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '../_lib/types';
import { Field } from './form-fields';

export interface NewAuthorDraft {
  key: string;
  name: string;
  role?: string;
  location?: string;
  url?: string;
  avatar?: string;
  bio?: string;
}

interface Props {
  open: boolean;
  /** Existing author keys so we can prevent collisions on Create. */
  existing: Set<string>;
  /** When set, the modal opens in Edit mode — fields pre-filled, key locked. */
  initial?: NewAuthorDraft;
  onClose: () => void;
  onSubmit: (draft: NewAuthorDraft) => void;
}

/**
 * Modal that captures the minimum frontmatter for a content/blog/authors/<key>
 * .md file — either creating a new one (key auto-derives from name) or
 * editing an existing one (key field is locked).
 */
export function AuthorCreateModal({
  open,
  existing,
  initial,
  onClose,
  onSubmit,
}: Props) {
  return open ? (
    <AuthorForm
      key={initial?.key ?? 'create'}
      existing={existing}
      initial={initial}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  ) : null;
}

function AuthorForm({
  existing,
  initial,
  onClose,
  onSubmit,
}: {
  existing: Set<string>;
  initial?: NewAuthorDraft;
  onClose: () => void;
  onSubmit: (draft: NewAuthorDraft) => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [key, setKey] = useState(initial?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(!!initial);
  const [role, setRole] = useState(initial?.role ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [avatar, setAvatar] = useState(initial?.avatar ?? '');
  const [bio, setBio] = useState(initial?.bio ?? '');

  const derivedKey = isEdit ? initial!.key : keyTouched ? key : slugify(name);
  const trimmedName = name.trim();
  // In edit mode collisions are fine — we're overwriting the same key.
  const collision = !isEdit && existing.has(derivedKey);
  const valid =
    !!trimmedName && !!derivedKey && /^[a-z0-9][a-z0-9-]*$/.test(derivedKey) && !collision;

  const submit = () => {
    if (!valid) return;
    onSubmit({
      key: derivedKey,
      name: trimmedName,
      role: role.trim() || undefined,
      location: location.trim() || undefined,
      url: url.trim() || undefined,
      avatar: avatar.trim() || undefined,
      bio: bio.trim() || undefined,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[10vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground w-[min(560px,92vw)] overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
          <UserPlus className="text-primary h-4 w-4" />
          <div className="text-foreground/95 flex-1 text-sm font-semibold">
            {isEdit ? `Edit author · ${initial!.key}` : 'New author'}
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
          <Field label="Name">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Patrick Arns"
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
            />
          </Field>
          <Field
            label="Key (slug)"
            hint={
              isEdit
                ? "Locked — renaming would move the markdown file too. Pop a new author instead if you want a different key."
                : collision
                  ? `An author with key "${derivedKey}" already exists.`
                  : 'Used as the filename and the `author:` value in frontmatter.'
            }
            error={collision}
          >
            <input
              value={derivedKey}
              disabled={isEdit}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
              placeholder="patrick"
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 font-mono text-xs outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role (optional)">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder of park.fan"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label="Location (optional)">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Germany"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="URL (optional)">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </Field>
            <Field label="Avatar URL (optional)">
              <input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="/blog/images/authors/patrick.jpg"
                className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </Field>
          </div>
          <Field label="Bio (optional)">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="One or two sentences for the author block on posts."
              rows={3}
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 text-sm outline-none"
            />
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
            {isEdit ? 'Save changes' : 'Create author'}
          </button>
        </div>
      </div>
    </div>
  );
}

