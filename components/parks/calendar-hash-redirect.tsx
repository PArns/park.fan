import type { Locale } from '@/i18n/config';
import {
  currentParkCalendarMonth,
  parkCalendarMonthsBack,
  parkCalendarMonthsForward,
  parkCalendarPath,
} from '@/lib/parks/calendar-segments';

/**
 * A JSON string literal that is safe inside a `<script>` body.
 *
 * `JSON.stringify` alone is not: it leaves `<` and `>` as themselves, so a value containing
 * `</script>` closes the tag and everything after it is markup. The values interpolated below come
 * from the route's own segments and from `park.timezone` — neither is typed as hostile, and neither
 * is validated against this either. Same escapes as `escapeJsonLd` in `components/seo/
 * structured-data.tsx`, which exists for this exact hazard; it takes an object, this takes a string.
 */
const scriptLiteral = (value: string) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

interface CalendarHashRedirectProps {
  locale: Locale | string;
  continent: string;
  country: string;
  city: string;
  parkSlug: string;
  /** The park's zone, so „this month" means the month it is THERE — see `currentParkCalendarMonth`. */
  timezone: string;
}

/**
 * Forwards an old `#calendar` / `#calendar-YYYY-MM` deep link to the calendar PAGE before the park
 * page hydrates.
 *
 * `useTabHashRouting` already does this, and keeps doing it — but it cannot do it early enough. Its
 * hop sits behind `isMounted`, which is set in an effect via `startTransition`, so the earliest it
 * can fire is two commits after hydration. The park page's client queries hang behind no such gate:
 * they start WITH hydration. So both documents fetched, and `#calendar` cost the live poll, the
 * nowcast and the neighbour list twice over — measured 12 calls / 121.9 KB against the 9 the
 * calendar page costs when it is opened directly (`node scripts/measure-api-calls.mjs --only park`,
 * 2026-10-01). The calendar MONTH was never fetched twice: the harness groups on the path, and the
 * calendar page asks for the grid and for today separately.
 *
 * **It is an inline script, not an effect**, for the same reason `HeroEntranceGate` is one: parsed
 * inline it runs while the document is still being read, before the deferred chunks that carry
 * React — and a `location.replace` there stops the load instead of racing it. An effect is by
 * construction too late; the thing it has to beat is hydration itself.
 *
 * **The month window is computed in the script, not baked in here.** The hook calls
 * `currentParkCalendarMonth(timezone)` at client runtime; serializing "now" into the markup would
 * freeze it at render time and land a month off across a month boundary — this page is prerendered.
 * What does travel from the server are the two RELATIVE bounds, because those are constants of this
 * repo rather than readings off a clock (`PARK_CALENDAR_MONTH_SPAN`, saturated at −3 since
 * 2026-04). `coverageTo` is deliberately not passed, matching what the hook does today: narrowing
 * the forward edge here would be a behaviour change this ticket does not ask for.
 *
 * A month outside the window falls back to the hub rather than forwarding into the route's 308,
 * which is what the hook does too.
 *
 * If the script is blocked, nothing is lost: the hook's own branch still forwards after hydration,
 * which is exactly today's behaviour. That branch also stays because this script only ever runs on
 * a document load — a client-side navigation carrying `#calendar`, and every later `hashchange`,
 * still go through the hook.
 */
export function CalendarHashRedirect({
  locale,
  continent,
  country,
  city,
  parkSlug,
  timezone,
}: CalendarHashRedirectProps) {
  const now = currentParkCalendarMonth(timezone);
  const minDelta = -parkCalendarMonthsBack(now);
  const maxDelta = parkCalendarMonthsForward(now, undefined);
  const hub = `/${locale}${parkCalendarPath(locale, continent, country, city, parkSlug)}`;
  // Same fallback as `currentParkCalendarMonth`, for the same reason: the field is typed as
  // present, and a payload that omits it would otherwise throw inside `Intl.DateTimeFormat`.
  const zone = timezone || 'UTC';

  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `(function(){var h=location.hash.slice(1),m=/^calendar-(\\d{4})-(\\d{2})$/.exec(h);` +
          `if(h!=="calendar"&&!m)return;var b=${scriptLiteral(hub)},t=b;` +
          `if(m){var y=+m[1],o=+m[2];if(o>=1&&o<=12){try{` +
          `var p=new Intl.DateTimeFormat("en-CA",{timeZone:${scriptLiteral(zone)},year:"numeric",month:"2-digit"}).formatToParts(new Date()),` +
          `g=function(k){var e=p.find(function(x){return x.type===k});return e?+e.value:0},` +
          `d=y*12+o-1-(g("year")*12+g("month")-1);` +
          `if(d>=${minDelta}&&d<=${maxDelta})t=b+"/"+y+"/"+o}catch(e){}}}` +
          `location.replace(t)})()`,
      }}
    />
  );
}
