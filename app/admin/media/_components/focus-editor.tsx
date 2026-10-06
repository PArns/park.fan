'use client';

import { useCallback, useRef } from 'react';
import Image from 'next/image';
import type { MediaFocus } from '@/lib/media/types';
import { FocusPreviews } from './focus-previews';
import { Tile } from '../../_ui/primitives';

/**
 * Framing cannot be judged on the source photo, so the previews render the real cards and
 * background (`FocusPreviews`), whose chrome decides how much of the photo survives.
 */

interface FocusEditorProps {
  src: string;
  alt: string;
  focus: MediaFocus | null;
  onChange: (focus: MediaFocus | null) => void;
}

/**
 * Media editor section for an image's focal point: click the photo to set it or clear it, then see
 * it in the real cards (`FocusPreviews`) and as an uncropped inline blog image.
 */
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
      <Tile
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
        {/* The full photo, undistorted, height-capped so a portrait original does not push the
            previews below the fold. */}
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
      </Tile>

      <Tile title="How it lands">
        <FocusPreviews src={src} objectPosition={position} />
      </Tile>

      {/* Inline blog images are never cropped; shown so it is clear the focal point does
          nothing there. */}
      <Tile title="Inline article image" hint="Uncropped — the focal point does not apply here.">
        <Image
          src={src}
          alt={alt}
          width={640}
          height={480}
          className="h-auto w-40 rounded-lg"
          sizes="160px"
        />
      </Tile>
    </div>
  );
}
