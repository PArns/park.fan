/**
 * Chrome's `<geolocation>` element (Chrome 144+). Its button is drawn by the browser; a tap on it
 * asks for location, and can lift an earlier block, which no script can. React has no typing for
 * it, and because the name has no hyphen React treats it as a plain element rather than a custom
 * one: its `location` event is attached with `addEventListener`, not an `onlocation` prop.
 */
import 'react';

declare global {
  interface HTMLGeolocationElement extends HTMLElement {
    readonly position: GeolocationPosition | null;
    readonly error: GeolocationPositionError | null;
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      geolocation: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLGeolocationElement>,
        HTMLGeolocationElement
      > & { accuracymode?: 'precise' | 'approximate' };
    }
  }
}
