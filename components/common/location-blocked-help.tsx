'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGeolocation } from '@/lib/contexts/geolocation-context';
import {
  locationHelpPlatform,
  type LocationHelpPlatform,
} from '@/lib/utils/geolocation-permission';

const subscribeNever = () => () => {};

function readPlatform(): LocationHelpPlatform {
  return locationHelpPlatform(navigator.userAgent, navigator.vendor, navigator.maxTouchPoints ?? 0);
}

/**
 * Whether `LocationBlockedHelp` renders the browser's `<geolocation>` element rather than our
 * popover. A caller that sets text beside it can tell whether that text is needed: the element
 * carries the browser's own label, the popover's "How to change this" does not say what.
 */
export function useHasGeolocationElement(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => 'HTMLGeolocationElement' in window,
    () => false
  );
}

/**
 * What a visitor whose browser blocks location can do about it, next to the "blocked" line on the
 * homepage and the park page (docs/rules/location-is-asked-for-where-it-is-needed.md).
 *
 * Chrome 144 and later get the browser's own `<geolocation>` element. A tap on it is a gesture the
 * browser can verify, and it can lift a block, or the week-long embargo after three dismissed
 * prompts, from the page itself. Its label and look are the browser's. Everywhere else a script
 * cannot lift a block, so this names the steps in this browser's settings, behind a popover so the
 * row keeps its one line.
 *
 * Rendered only after the permission check, so reading `window` here never meets the server.
 */
export function LocationBlockedHelp() {
  const t = useTranslations('location');
  const { refresh } = useGeolocation();
  const hasElement = useHasGeolocationElement();
  const platform = useSyncExternalStore<LocationHelpPlatform>(
    subscribeNever,
    readPlatform,
    () => 'default'
  );
  const elementRef = useRef<HTMLGeolocationElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    // A fix means the browser now grants location. The context hears that from the permission's
    // `change` event as well; reading once more here costs a cached fix at most.
    const onLocation = () => {
      if (element.position) refresh();
    };
    element.addEventListener('location', onLocation);
    return () => element.removeEventListener('location', onLocation);
  }, [hasElement, refresh]);

  if (hasElement) {
    return (
      <geolocation
        ref={elementRef}
        className="border-border bg-background text-foreground inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-sm font-medium"
      />
    );
  }

  const steps =
    platform === 'ios-safari'
      ? t('stepsIosSafari')
      : platform === 'mac-safari'
        ? t('stepsMacSafari')
        : t('stepsDefault');

  return (
    <Popover>
      <PopoverTrigger className="text-primary shrink-0 font-semibold underline-offset-2 hover:underline">
        {t('howTo')}
      </PopoverTrigger>
      <PopoverContent align="end" className="text-sm leading-snug">
        {steps}
      </PopoverContent>
    </Popover>
  );
}
