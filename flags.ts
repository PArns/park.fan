import { flag } from 'flags/next';

export type DebugGeoMode = 'real' | 'near' | 'in';

/**
 * Debug geolocation mode for local/preview (Vercel Toolbar Flags Explorer).
 * - real: use browser/IP geolocation
 * - near: simulate position near Phantasialand (~2 km) → nearby_parks
 * - in: simulate position inside Phantasialand → in_park
 */
export const debugGeoModeFlag = flag({
  key: 'debug-geo-mode',
  description: 'Override geolocation for debugging: Real, Near Phantasialand, or In Phantasialand',
  options: [
    { value: 'real' as DebugGeoMode, label: 'Real (browser/IP)' },
    { value: 'near' as DebugGeoMode, label: 'Near Phantasialand' },
    { value: 'in' as DebugGeoMode, label: 'In Phantasialand' },
  ],
  decide(): DebugGeoMode {
    return 'real';
  },
});
