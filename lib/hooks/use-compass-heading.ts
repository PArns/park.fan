'use client';

import { useCallback, useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react';
import {
  headingFromOrientation,
  smoothHeading,
  type OrientationReading,
} from '@/lib/utils/compass';

/**
 * Where the compass stands.
 *
 * - `pending` — listening, nothing heard yet.
 * - `needs-permission` — iOS: the events exist but arrive only after
 *   `DeviceOrientationEvent.requestPermission()`, which Safari allows only inside a tap.
 * - `active` — headings are arriving.
 * - `unavailable` — no compass: a desktop, or a phone whose browser sends no absolute heading.
 *   The ring then stays north-up, which is still a map.
 * - `denied` — the reader said no to the iOS prompt.
 */
export type CompassStatus = 'pending' | 'needs-permission' | 'active' | 'unavailable' | 'denied';

/** How long to wait for a first absolute heading before calling the device compass-less. */
const FIRST_READING_MS = 1500;

type PermissionRequester = { requestPermission?: () => Promise<'granted' | 'denied'> };

/** What the browser offers at all — a fact about the device, read once, never changing. */
type Capability = 'none' | 'ios' | 'standard';

function readCapability(): Capability {
  const requester = window.DeviceOrientationEvent as
    (typeof DeviceOrientationEvent & PermissionRequester) | undefined;
  if (!requester) return 'none';
  return typeof requester.requestPermission === 'function' ? 'ios' : 'standard';
}
const subscribeNever = () => () => {};

function screenAngle(): number {
  return window.screen?.orientation?.angle ?? 0;
}

/**
 * The phone's compass heading, delivered through a callback rather than through state.
 *
 * A magnetometer fires at 60 Hz. Put in React state, every sample would re-render the whole ring
 * and its list. The caller gets each smoothed heading in `onHeading` — `ParkCompass` writes it into
 * one CSS custom property, and every marker and arrow turns off that — while React only hears about
 * the status, which changes a handful of times per visit.
 *
 * `enabled` is the caller's visibility: off screen, nothing listens.
 */
export function useCompassHeading(
  onHeading: (heading: number) => void,
  enabled: boolean
): { status: CompassStatus; enable: () => void } {
  const capability = useSyncExternalStore(subscribeNever, readCapability, (): Capability => 'none');
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [stream, setStream] = useState<'pending' | 'active' | 'silent'>('pending');
  const emit = useEffectEvent((heading: number) => onHeading(heading));

  useEffect(() => {
    if (!enabled || capability === 'none') return;
    if (capability === 'ios' && permission !== 'granted') return;

    // Chrome sends the north-referenced stream as its own event; Safari and Firefox put it on the
    // plain one (Safari as `webkitCompassHeading`, Firefox as `absolute: true`).
    const eventName =
      'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    let smoothed: number | null = null;
    let frame = 0;
    let heard = false;
    const onEvent = (event: Event) => {
      const heading = headingFromOrientation(event as unknown as OrientationReading, screenAngle());
      if (heading === null) return;
      smoothed = smoothHeading(smoothed, heading);
      if (!heard) {
        heard = true;
        setStream('active');
      }
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (smoothed !== null) emit(smoothed);
      });
    };
    window.addEventListener(eventName, onEvent);
    const timer = window.setTimeout(() => {
      if (!heard) setStream((s) => (s === 'active' ? s : 'silent'));
    }, FIRST_READING_MS);
    return () => {
      window.removeEventListener(eventName, onEvent);
      window.clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, capability, permission]);

  const enable = useCallback(() => {
    const requester = window.DeviceOrientationEvent as
      (typeof DeviceOrientationEvent & PermissionRequester) | undefined;
    if (!requester?.requestPermission) return;
    // Called straight from the tap handler: Safari refuses a request that is not inside a gesture.
    requester
      .requestPermission()
      .then((answer) => setPermission(answer === 'granted' ? 'granted' : 'denied'))
      .catch(() => setPermission('denied'));
  }, []);

  const status: CompassStatus =
    capability === 'none'
      ? 'unavailable'
      : capability === 'ios' && permission === 'denied'
        ? 'denied'
        : capability === 'ios' && permission !== 'granted'
          ? 'needs-permission'
          : stream === 'active'
            ? 'active'
            : stream === 'silent'
              ? 'unavailable'
              : 'pending';

  return { status, enable };
}
