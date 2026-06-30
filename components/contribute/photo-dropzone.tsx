'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ACCEPT_ATTR,
  MAX_FILES,
  MAX_ORIGINAL_FILE_SIZE,
  formatBytes,
  isAcceptedMimeType,
} from '@/lib/contribute/config';

export interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface PhotoDropzoneProps {
  images: PendingImage[];
  onChange: (next: PendingImage[]) => void;
  disabled?: boolean;
}

interface Rejection {
  name: string;
  reason: 'type' | 'size' | 'max';
}

/**
 * Drag & drop (or click-to-browse) multi-image picker. Controlled: the parent owns
 * the `images` array; this component validates additions, builds/revokes object-URL
 * previews, and renders the thumbnail grid. Bytes are never read here — only on submit.
 */
export function PhotoDropzone({ images, onChange, disabled }: PhotoDropzoneProps) {
  const t = useTranslations('contribute.dropzone');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [rejections, setRejections] = useState<Rejection[]>([]);

  // Revoke every preview URL on unmount so we don't leak blob: URLs.
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);
      const accepted: PendingImage[] = [];
      const rejected: Rejection[] = [];
      let slots = MAX_FILES - images.length;

      for (const file of incoming) {
        if (!isAcceptedMimeType(file.type)) {
          rejected.push({ name: file.name, reason: 'type' });
          continue;
        }
        if (file.size > MAX_ORIGINAL_FILE_SIZE) {
          rejected.push({ name: file.name, reason: 'size' });
          continue;
        }
        if (slots <= 0) {
          rejected.push({ name: file.name, reason: 'max' });
          continue;
        }
        slots -= 1;
        accepted.push({
          id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
        });
      }

      setRejections(rejected);
      if (accepted.length > 0) onChange([...images, ...accepted]);
    },
    [images, onChange]
  );

  const removeImage = (id: string) => {
    const target = images.find((img) => img.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((img) => img.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const reasonText = (reason: Rejection['reason']) =>
    reason === 'type' ? t('badType') : reason === 'size' ? t('tooLarge') : t('tooMany');

  return (
    <div className="flex flex-col gap-3">
      {/* Drop area */}
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all outline-none',
          'border-primary/25 bg-primary/[3%] hover:border-primary/50 hover:bg-primary/[6%]',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          dragActive && 'border-primary bg-primary/10 scale-[1.01]',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-110">
          <UploadCloud className="size-7" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">{t('title')}</p>
          <p className="text-muted-foreground text-sm">{t('hint')}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" tabIndex={-1}>
          <ImagePlus className="size-4" />
          {t('browse')}
        </Button>
        <p className="text-muted-foreground/70 text-xs">
          {t('limits', { max: MAX_FILES, size: formatBytes(MAX_ORIGINAL_FILE_SIZE) })}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
      </div>

      {/* Rejection notices */}
      {rejections.length > 0 && (
        <ul className="text-destructive space-y-0.5 text-xs">
          {rejections.map((r, i) => (
            <li key={`${r.name}-${i}`} className="truncate">
              {r.name} — {reasonText(r.reason)}
            </li>
          ))}
        </ul>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {images.map((img) => (
              <figure
                key={img.id}
                className="group bg-muted/40 relative aspect-square overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a remote asset */}
                <img src={img.previewUrl} alt={img.file.name} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  aria-label={t('remove')}
                  className="bg-background/80 text-foreground hover:bg-destructive absolute top-1 right-1 flex size-6 items-center justify-center rounded-full shadow-sm backdrop-blur-sm transition-colors hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
                <figcaption className="bg-background/70 text-muted-foreground absolute inset-x-0 bottom-0 truncate px-1.5 py-0.5 text-[10px] backdrop-blur-sm">
                  {formatBytes(img.file.size)}
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-muted-foreground text-xs">
            {t('count', { count: images.length, max: MAX_FILES })}
          </p>
        </>
      )}
    </div>
  );
}
