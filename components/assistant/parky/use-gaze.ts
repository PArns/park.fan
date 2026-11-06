'use client';

import { useEffect, useRef, useState } from 'react';
import { PARKY_LANDED_EVENT } from '@/lib/assistant/parky-jump';

/** How far a pupil may wander inside its eye, in the 48-unit drawing. */
const PUPIL_REACH = 2.2;

/** The point between the eyes Parky squints at when the pointer rests on it, and how near counts. */
const NOSE = { x: 24, y: 26, reach: 4 };
/** Where each pupil goes in that squint: both in towards the nose. */
const CROSS_GAZE = { x: 2, y: 1.4 };
/** Two whole turns of the pointer round Parky within this long make it dizzy. */
const CIRCLE_TURNS = 2;
const CIRCLE_WINDOW_MS = 1_500;
/** Circles wider than this, in px from its centre, are the visitor's business, not Parky's. */
const CIRCLE_RADIUS = 160;

/** Where the pointer was last seen, shared by every Parky on the page, so a new one looks at once. */
let lastPointer: { x: number; y: number } | null = null;

/**
 * The pupils' offset towards the pointer, so Parky looks at the mouse. Only for a fine pointer and
 * without reduced motion; one frame at most per pointer move. A Parky that appears looks where the
 * pointer was last seen, and `pointerover`, which the browser sends when the page moves under a
 * still pointer, aims him without waiting for the mouse to move, and so does a hop landing
 * (`PARKY_LANDED_EVENT`). Two easter eggs ride along: the
 * pointer on Parky's nose makes it squint at it (`cross`), and the pointer circling it fast, two
 * turns inside 1.5 s, calls `onDizzy`.
 */
export function useGaze(svg: React.RefObject<SVGSVGElement | null>, onDizzy?: () => void) {
  const [gaze, setGaze] = useState({ x: 0, y: 0, cross: false });
  const dizzy = useRef(onDizzy);
  useEffect(() => {
    dizzy.current = onDizzy;
  }, [onDizzy]);
  useEffect(() => {
    const media = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!media.matches) return;
    let frame = 0;
    // The turning so far: the last angle, and each step's signed change with its time.
    let angle: number | null = null;
    let steps: { at: number; turn: number }[] = [];
    /** Turns the pupils towards a point; its distance from Parky's middle, or null unmeasured. */
    const aim = (pointX: number, pointY: number): { dx: number; dy: number } | null => {
      const box = svg.current?.getBoundingClientRect();
      if (!box || box.width === 0) return null;
      const dx = pointX - (box.left + box.width / 2);
      const dy = pointY - (box.top + box.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const unit = box.width / 48;
      const nose = Math.hypot(
        pointX - (box.left + NOSE.x * unit),
        pointY - (box.top + NOSE.y * unit)
      );
      if (nose <= NOSE.reach * unit) {
        setGaze({ ...CROSS_GAZE, cross: true });
      } else {
        const pull = Math.min(1, distance / 240);
        setGaze({
          x: (dx / distance) * PUPIL_REACH * pull,
          y: (dy / distance) * PUPIL_REACH * pull,
          cross: false,
        });
      }
      return { dx, dy };
    };
    const seen = lastPointer;
    if (seen)
      frame = requestAnimationFrame(() => {
        frame = 0;
        aim(seen.x, seen.y);
      });
    // A hop moves Parky under a still pointer, and the page scrolling under it aims him mid-air:
    // once he lands, he looks again from where he stands.
    const onLanded = () => {
      const pointer = lastPointer;
      if (!pointer || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        aim(pointer.x, pointer.y);
      });
    };
    const onOver = (event: PointerEvent) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        aim(event.clientX, event.clientY);
      });
    };
    const onMove = (event: PointerEvent) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const aimed = aim(event.clientX, event.clientY);
        if (!aimed) return;
        const { dx, dy } = aimed;
        const distance = Math.hypot(dx, dy) || 1;

        if (!dizzy.current || distance > CIRCLE_RADIUS) {
          angle = null;
          steps = [];
          return;
        }
        const now = Date.now();
        const next = Math.atan2(dy, dx);
        if (angle !== null) {
          // The shorter way round, so crossing ±π is a small step and not a whole turn back.
          let turn = next - angle;
          if (turn > Math.PI) turn -= 2 * Math.PI;
          if (turn < -Math.PI) turn += 2 * Math.PI;
          steps.push({ at: now, turn });
        }
        angle = next;
        steps = steps.filter((step) => now - step.at <= CIRCLE_WINDOW_MS);
        const turned = Math.abs(steps.reduce((sum, step) => sum + step.turn, 0));
        if (turned >= CIRCLE_TURNS * 2 * Math.PI) {
          steps = [];
          dizzy.current();
        }
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener(PARKY_LANDED_EVENT, onLanded);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener(PARKY_LANDED_EVENT, onLanded);
      cancelAnimationFrame(frame);
    };
  }, [svg]);
  return gaze;
}
