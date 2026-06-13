'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '../_lib/types';
import { Field } from './form-fields';
import { ImagePicker } from './image-picker';

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
 * editing an existing one (key field is locked). The live preview band at the
 * top mirrors the author block readers see on published posts.
 */
export function AuthorCreateModal({ open, existing, initial, onClose, onSubmit }: Props) {
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
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

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

  // Esc closes, ⌘/Ctrl+Enter saves — without stealing keys from the nested
  // ImagePicker while it's open. Latest closures live in refs (synced
  // post-render; React 19 forbids ref writes during render).
  const submitRef = useRef(submit);
  const pickerOpenRef = useRef(avatarPickerOpen);
  useEffect(() => {
    submitRef.current = submit;
    pickerOpenRef.current = avatarPickerOpen;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pickerOpenRef.current) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[8vh] backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="border-border/60 bg-popover text-popover-foreground animate-in fade-in slide-in-from-top-2 w-[min(580px,92vw)] overflow-hidden rounded-2xl border shadow-2xl duration-200">
        <div className="border-border/60 from-primary/10 flex items-center gap-2.5 border-b bg-gradient-to-r to-transparent px-4 py-3">
          <div className="from-primary/25 to-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br">
            <UserPlus className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-foreground/95 text-sm font-semibold">
              {isEdit ? 'Edit author' : 'New author'}
            </div>
            <div className="text-muted-foreground truncate font-mono text-[10px]">
              content/blog/authors/{derivedKey || '…'}.md
            </div>
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

        {/* Live preview — the author block readers get on posts. */}
        <div className="border-border/40 bg-muted/20 flex items-center gap-3 border-b px-4 py-3">
          <div className="from-primary/25 to-primary/5 text-primary relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-base font-bold">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              (trimmedName || '?').charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="text-foreground truncate text-sm font-semibold">
              {trimmedName || 'Author name'}
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {[role.trim(), location.trim()].filter(Boolean).join(' · ') || 'Role · Location'}
            </div>
          </div>
          <span className="text-muted-foreground/60 ml-auto shrink-0 text-[10px] font-semibold tracking-wider uppercase">
            Preview
          </span>
        </div>

        <div className="grid gap-3 px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Patrick Arns"
                className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
              />
            </Field>
            <Field
              label="Key (slug)"
              hint={
                isEdit
                  ? 'Locked — renaming would move the file.'
                  : collision
                    ? `"${derivedKey}" already exists.`
                    : 'Filename + `author:` frontmatter value.'
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
                className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-60"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role (optional)">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Founder of park.fan"
                className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
              />
            </Field>
            <Field label="Location (optional)">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Germany"
                className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="URL (optional)">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
              />
            </Field>
            <Field label="Avatar (optional)">
              <div className="flex items-center gap-1.5">
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="/blog/images/authors/patrick.jpg"
                  className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground min-w-0 flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAvatarPickerOpen(true)}
                  title="Pick or upload an avatar"
                  className="hover:bg-accent/50 text-primary border-border/60 inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2 text-[10px] font-semibold transition-colors"
                >
                  <ImageIcon className="h-3 w-3" />
                  Pick…
                </button>
              </div>
            </Field>
          </div>
          <Field label="Bio (optional)">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="One or two sentences for the author block on posts."
              rows={3}
              className="bg-background/60 border-border/60 focus:border-primary/50 text-foreground rounded-lg border px-3 py-1.5 text-sm transition-colors outline-none"
            />
          </Field>
        </div>

        <div className="border-border/60 bg-muted/20 flex items-center gap-2 border-t px-4 py-3">
          <span className="text-muted-foreground/70 mr-auto hidden text-[10px] sm:block">
            <kbd className="bg-muted rounded px-1 py-0.5 font-mono">Esc</kbd> cancel ·{' '}
            <kbd className="bg-muted rounded px-1 py-0.5 font-mono">⌘⏎</kbd> save
          </span>
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
      <ImagePicker
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        onPick={(r) => {
          setAvatar(r.src);
          setAvatarPickerOpen(false);
        }}
      />
    </div>
  );
}
