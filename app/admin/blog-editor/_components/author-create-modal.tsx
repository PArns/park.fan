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
  /** Existing author keys so we can prevent collisions. */
  existing: Set<string>;
  onClose: () => void;
  onCreate: (draft: NewAuthorDraft) => void;
}

/**
 * Modal that captures the minimum frontmatter needed for a new
 * content/blog/authors/<key>.md file. Key auto-derives from Name (until the
 * author manually edits it) so the common case is "type a name → Create".
 */
export function AuthorCreateModal({ open, existing, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [avatar, setAvatar] = useState('');
  const [bio, setBio] = useState('');

  if (!open) return null;

  const derivedKey = keyTouched ? key : slugify(name);
  const trimmedName = name.trim();
  const collision = existing.has(derivedKey);
  const valid =
    !!trimmedName && !!derivedKey && /^[a-z0-9][a-z0-9-]*$/.test(derivedKey) && !collision;

  const submit = () => {
    if (!valid) return;
    onCreate({
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
          <div className="text-foreground/95 flex-1 text-sm font-semibold">New author</div>
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
              collision
                ? `An author with key "${derivedKey}" already exists.`
                : 'Used as the filename and the `author:` value in frontmatter.'
            }
            error={collision}
          >
            <input
              value={derivedKey}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
              placeholder="patrick"
              className="bg-background/60 border-border/60 text-foreground rounded-lg border px-3 py-1.5 font-mono text-xs outline-none"
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
            Create author
          </button>
        </div>
      </div>
    </div>
  );
}

