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
 * `useTabHashRouting` does this too, but only after hydration, by which time the park page's
 * client queries have started and the visit pays for both documents. An inline script runs before
 * the deferred React chunks, so `location.replace` stops the load instead of racing it.
 *
 * The month window is computed in the script, because this page is prerendered and a baked "now"
 * would be a month off across a month boundary; only the relative bounds travel from the server.
 * `coverageTo` is not passed, as in the hook. A month outside the window falls back to the hub, as
 * the hook does. The hook stays for client-side navigations, `hashchange` and a blocked script.
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
