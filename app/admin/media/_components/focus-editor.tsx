'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import type { MediaFocus } from '@/lib/media/types';
import { FocusPreviews } from './focus-previews';
import { Section } from './panel-ui';

/**
 * Set an image's focal point, and see what it does everywhere the site paints it.
 *
 * Framing cannot be judged on the source photo: a picture that looks fine at 4:3
 * loses the top of its subject in a wide ride card and keeps it in a tall one. The
 * previews therefore render the REAL cards and background (see `FocusPreviews`),
 * in their open and closed states, because the card chrome — a glass header over
 * the top, a wait panel over the bottom — decides how much of the photo survives.
 */

interface FocusEditorProps {
  src: string;
  alt: string;
  focus: MediaFocus | null;
  onChange: (focus: MediaFocus | null) => void;
}

export function FocusEditor({ src, alt, focus, onChange }: FocusEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const setFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = frameRef.current?.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return;
      const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);
      onChange({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) });
    },
    [onChange]
  );

  // `null` means "nobody has looked at this yet"; it renders the same as centre but
  // the admin lists it as outstanding work, so clearing is distinct from centring.
  const marker = focus ?? { x: 0.5, y: 0.5 };
  const position = `${marker.x * 100}% ${marker.y * 100}%`;

  return (
    <div className="space-y-4">
      <Section
        title="Focal point"
        action={
          <div className="flex items-center gap-2 text-xs">
            {focus ? (
              <>
                <span className="text-muted-foreground font-mono">
                  {marker.x.toFixed(2)} / {marker.y.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="border-border hover:bg-muted rounded-md border px-2 py-0.5 transition-colors"
                >
                  Clear
                </button>
              </>
            ) : (
              <span className="text-muted-foreground text-[11px]">not set — crops from centre</span>
            )}
          </div>
        }
      >
        {/* Click target: the full photo, undistorted, with the point marked.
            Height-capped rather than full-bleed — a portrait original filled the
            column on its own and pushed "How it lands", the part that answers
            whether the point is right, below the fold. */}
        <div
          ref={frameRef}
          role="application"
          aria-label="Click to set the focal point"
          onClick={(e) => setFromEvent(e.clientX, e.clientY)}
          className="border-border relative mx-auto w-fit cursor-crosshair overflow-hidden rounded-lg border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic ratio, no layout box to reserve */}
          <img
            src={src}
            alt={alt}
            className="block max-h-[42vh] w-auto max-w-full select-none"
            draggable={false}
          />
          <span
            className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.55)]"
            style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
          />
        </div>
        <p className="text-muted-foreground text-[11px]">
          Click the subject that must survive every crop. Drives both the CSS crop on cards and the
          build-time 16:9 / 4:3 / 1:1 renditions.
        </p>
      </Section>

      <Section title="How it lands">
        <FocusPreviews src={src} objectPosition={position} />
      </Section>

      {/* Inline blog images are never cropped — they keep their own ratio. Shown
          small, and only to make it obvious the focal point does nothing here,
          rather than leaving somebody wondering why it had no effect. */}
      <Section title="Inline article image" hint="Uncropped — the focal point does not apply here.">
        <Image
          src={src}
          alt={alt}
          width={640}
          height={480}
          className="h-auto w-40 rounded-lg"
          sizes="160px"
        />
      </Section>
    </div>
  );
}
