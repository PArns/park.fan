import { cookies } from 'next/headers';
import { TemperatureUnitProvider } from '@/lib/contexts/temperature-unit-context';
import type { TemperatureUnit } from '@/lib/utils/temperature';

/**
 * Park-scoped layout.
 *
 * Reads the saved temperature-unit cookie HERE (not in the root layout) and seeds
 * a nested TemperatureUnitProvider, so the server-rendered weather/calendar temps
 * on park detail pages already use the visitor's preferred unit — no °C→°F flash.
 *
 * Confining the cookie() read to this subtree keeps the homepage and all geo
 * pages (which never show temperatures) statically prerenderable (ISR), instead
 * of forcing the entire app into dynamic rendering. This nested provider wins
 * over the global one (from the root Providers) for everything below it.
 */
export default async function ParkLayout({ children }: { children: React.ReactNode }) {
  const tempUnitCookie = (await cookies()).get('temp_unit')?.value;
  const initialUnit: TemperatureUnit | undefined =
    tempUnitCookie === 'C' || tempUnitCookie === 'F' ? tempUnitCookie : undefined;

  return <TemperatureUnitProvider initialUnit={initialUnit}>{children}</TemperatureUnitProvider>;
}
