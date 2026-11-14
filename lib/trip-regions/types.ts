import type { ParkSeasonKind, ParkSeasonStatus } from '@/lib/api/types';

/**
 * The shapes of the API's trip-region routes (`/v1/trip-regions/:region`, `/calendar`,
 * `/best-days`), as a region's hub and its planner read them. The contract and every rule behind
 * a field: the API's `docs/frontend/trip-regions.md`. The plan's own shapes live beside the
 * planner in `lib/trip-regions/plan.ts`; what is the region's and not the API's is the registry
 * (`lib/trip-regions/registry.ts`). No runtime code here, so a Client Component can import it.
 */

/** A park's kind inside a region: water parks and Discovery Cove are priced flat by the plan. */
export type TripParkType = 'theme_park' | 'water_park' | 'reservation_park';

/** A group of parks: a resort, or the day trips that share no resort. */
export interface TripRegionGroup {
  /** `walt-disney-world`, `universal-orlando`, `seaworld-orlando`, `day-trips`. */
  key: string;
  name: string;
  kind: 'resort' | 'day_trip';
}

/** One park of the region. */
export interface TripRegionPark {
  id: string;
  slug: string;
  name: string;
  /** The park's page on park.fan, locale-free: `/parks/north-america/united-states/orlando/epcot`. */
  path: string;
  /** A {@link TripRegionGroup} key. */
  group: string;
  type: TripParkType;
  /** One of the region's headliner parks, the plan's default pick. */
  headliner: boolean;
  /**
   * A short code for tight views, curated where initials would clash (Tokyo Disneyland `DL`, Tokyo
   * DisneySea `DS`); absent, the client derives one (`parkCode`).
   */
  code?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * A resort's slot before the day guests' opening that some hotel guests get, by the region's own
 * name: Orlando's `early_entry` (also Disneyland Resort's) and `early_park_admission`, Tokyo Disney
 * Resort's `happy_entry`, Disneyland Paris' `extra_magic_time`. A code this client has no words
 * for is shown as nothing, as the contract asks.
 */
export type TripEarlyKind =
  'early_entry' | 'early_park_admission' | 'happy_entry' | 'extra_magic_time';

/** A hotel perk, as the plan's `perks` and `reasons` name it. */
export type TripPerk = TripEarlyKind | 'extended_evening' | 'express_included';

/** A `hotel=` value of the region with the perks a stay there carries (`hotels` on the region). */
export interface TripHotel {
  key: string;
  perks: TripPerk[];
}

/**
 * The market codes a region's tickets and links name, where each is sold; `home` is the operators'
 * own shops.
 */
export interface TripTicketMarkets {
  home: string;
  codes: string[];
}

/** A storm season of the region: Orlando's hurricanes, Japan's typhoons. */
export interface TripStormSeason {
  kind: 'hurricane' | 'typhoon';
  /** `MM-DD`. */
  from: string;
  to: string;
  peak?: { from: string; to: string };
}

/** What a region's days are priced and warned with. */
export interface TripWeather {
  storm?: TripStormSeason;
  /** Seasons the answers name but do not price: Japan's `rainy_season`. */
  notes?: Array<{ kind: 'rainy_season' | (string & {}); from: string; to: string }>;
  /** The park whose climate normals stand for the region's months. */
  climatePark?: string;
}

/** Where a visitor sleeps, for drive times and the perks a stay there usually means. */
export interface TripHotelArea {
  /** `disney`, `disney_springs`, `universal`, `international_drive`, `lake_buena_vista`, `kissimmee`. */
  key: string;
  name: string;
  latitude: number;
  longitude: number;
  perks: TripPerk[];
}

/**
 * A way between two places other than a drive: a resort's own transport, or in a region that travels
 * by train (Japan) the lines between cities. `rail` is a regional or commuter line, `highway_bus` a
 * coach between cities, `shuttle` a hotel's or a park's own.
 */
export type TripTransportMode =
  | 'monorail'
  | 'skyliner'
  | 'boat'
  | 'bus'
  | 'walk'
  | 'train'
  | 'shinkansen'
  | 'rail'
  | 'metro'
  | 'highway_bus'
  | 'shuttle';

/** The resort's own transport beside a drive: curated estimates, waiting included. */
export interface TripTransportAlternative {
  mode: TripTransportMode;
  /** Absent for the buses, whose waits vary too much to name one. */
  minutes?: number;
  via?: string;
  name?: string;
  ticket?: 'park_to_park';
}

/**
 * One leg between two parks or a hotel area and a park, both ways. A drive ends at the car park
 * (`via`), and `transferMinutes` is the curated rest of the way to the gate.
 */
export interface TripLeg {
  /** A park slug or `hotel:<area key>`. */
  from: string;
  to: string;
  km?: number;
  minutes: number;
  mode: 'drive' | TripTransportMode;
  via?: 'ttc' | 'garage_shuttle' | string;
  transferMinutes?: number;
  /** `curated` where the leg is not the region's own source (a walk inside an OSRM region). */
  source?: 'curated';
  /** A rail leg's line ("Keiyo Line"). */
  name?: string;
  alternatives?: TripTransportAlternative[];
}

/**
 * The travel matrix: a drive without traffic read from OpenStreetMap through OSRM (`osrm`,
 * `free_flow`), or in a region that travels by train legs curated from timetables (`curated`,
 * `timetable`, no attribution).
 */
export interface TripTravel {
  source: 'osrm' | 'curated';
  computedOn: string;
  /** "© OpenStreetMap contributors"; shown wherever a drive time is, where there is one. */
  attribution: string;
  basis: 'free_flow' | 'timetable';
  legs: TripLeg[];
}

/** A place for an evening that is not a park: Disney Springs, CityWalk, ICON Park. */
export interface TripVenue {
  key: string;
  name: string;
  /** A {@link TripRegionGroup} key. */
  group: string;
  kind: string;
  latitude: number;
  longitude: number;
  typicalHours?: string;
  /** No ticket needed. */
  free: boolean;
  /** The venue's official page. */
  url: string;
  notes?: string;
}

/** How a ticket hops between parks: never, as the `.h` option, or always. */
export type TicketHopping = 'none' | 'optional' | 'included';

/**
 * Where a ticket is bought: the operator's shop (`official`), or another seller. A `sponsored` link
 * is an affiliate or paid one, which the page labels as such; `markets` and `locales` say where it
 * sells and in which language, which orders and labels it; absent for everyone.
 */
export interface TicketLink {
  /** The seller's own name, never translated. */
  seller: string;
  url: string;
  official?: boolean;
  sponsored: boolean;
  /** Codes of the region's `ticketMarkets`. */
  markets?: string[];
  locales?: string[];
}

/**
 * One product of the region's ticket catalog, as the planner reads it: the operator's rules for its
 * days, window and hopper, and where to buy it. No price anywhere; `shopUrl` is the operator's shop.
 */
export interface TicketProduct {
  /** Stable, the contract's key: `wdw-uk-14-day-magic`. */
  id: string;
  /** The operator's product name, never translated. */
  name: string;
  /** The {@link TripRegionGroup} key of the operator that sells it. */
  resort: string;
  /**
   * Where it is sold, codes of the region's `ticketMarkets`: `home` the operators' own shops (`us`
   * in Orlando), `uk` shops in the UK and Ireland, `intl` sellers elsewhere. A label, never a filter.
   */
  markets: string[];
  parks: string[];
  /** The lengths on sale; `unlimited` for a pass and the products with only a window. */
  days: { min: number; max: number } | 'unlimited';
  /** Per length, the calendar days its use may spread over from the start (the start is day 1). */
  windowTable?: Array<{ days: number; window: number }>;
  /** The window of a product without a day count (SeaWorld's Four Parks: 14 days). */
  windowDays?: number;
  /** `start`: the date chosen at purchase; `first_use`: the first visit. */
  anchor: 'start' | 'first_use';
  hopping: TicketHopping;
  /** Visits on a separate allowance that use no ticket day (the UK Magic Tickets' water parks). */
  allowance?: { parks: string[]; visits: number | 'days' };
  /** Parks used only on the start date: Discovery Cove's reserved day. */
  reservedDayParks?: string[];
  /** The start dates it is sold for; absent when no limit is known. */
  onSale?: Array<{ from?: string; to?: string }>;
  /** The last day a pass or Fun Card is valid. */
  until?: string;
  /** An annual pass or Fun Card: no day count, no window. */
  pass?: boolean;
  /** An evening ticket admits from this park-local time (`15:00`); plan first never suggests one. */
  entryFrom?: string;
  /** The kinds of day an evening ticket is used on; absent: every day. */
  validDays?: Array<'weekday' | 'weekend' | 'holiday'>;
  blockouts?: boolean;
  /** The operator's page with the blockout calendar. */
  blockoutUrl?: string;
  /** Where passholders reserve their park. */
  reservationUrl?: string;
  /** Where to buy, in the admin's order; the operator's own shop is one of them. */
  links?: TicketLink[];
  shopUrl?: string;
}

/** `GET /v1/trip-regions/:region/tickets`: the catalog the admin keeps, with its version. */
export interface TripTicketCatalog {
  region: string;
  /** Changes with every edit; plans are cached by it. */
  version: string;
  updatedAt: string;
  tickets: TicketProduct[];
}

/** Where a trip arrives or leaves: an airport, or a station a long-distance train reaches. */
export interface TripGateway {
  /** `HND`, `KIX`, `CDG`, `XED`. */
  code: string;
  name: string;
  kind: 'airport' | 'station';
  /** To the base's main area, where the API names it. */
  minutes?: number;
}

/** A park a day from a base reaches: door to door, one way, curated. */
export interface TripBasePark {
  slug: string;
  minutes: number;
  mode: 'drive' | TripTransportMode;
}

/**
 * A city a trip sleeps in (Japan, Paris). Each hotel area belongs to one base; `order` is its place
 * on the route line, absent in a region whose bases lie on none (Paris).
 */
export interface TripBase {
  key: string;
  name: string;
  order?: number;
  hotelAreas: string[];
  defaultArea?: string;
  gateways?: TripGateway[];
  /** Where to sleep in the base, one curated English line. */
  stayNote?: string;
  parks: TripBasePark[];
}

/** What a move between two bases asks of the traveller: the JR Pass, a seat, the luggage sent ahead. */
export type TripBaseLegNote = 'jr_pass' | 'reserve_seat' | 'forward_luggage';

/** The move between two bases, both ways: door to door between their main areas, the wait included. */
export interface TripBaseLeg {
  from: string;
  to: string;
  minutes: number;
  mode: 'drive' | TripTransportMode;
  /** The line or the service, in English ("Tokaido Shinkansen Nozomi"). */
  name?: string;
  /** Whether a park fits the day of this move. */
  parkDay: boolean;
  fromStop?: string;
  toStop?: string;
  changes?: number;
  notes?: TripBaseLegNote[];
}

/** How the region prices days across cities, and the hotel-change buffers a visitor may pick. */
export interface TripStayRules {
  dayTripFreeMinutes: number;
  /** The buffer a hotel change gets without `moveBuffer=`: 30 in Japan (luggage sent ahead), 60 elsewhere. */
  moveOverheadMinutes: number;
  parkDayMaxLegMinutes: number;
  moveCost: number;
  /** `HH:MM`, park-local. */
  moveStartsAt: string;
  lastArrivalAt: string;
  /** The `moveBuffer=` values the plan takes. */
  moveBufferOptions?: number[];
}

/** `GET /v1/trip-regions/:region`: open, a day at the edge. */
export interface TripRegion {
  slug: string;
  name: string;
  timezone: string;
  groups: TripRegionGroup[];
  parks: TripRegionPark[];
  hotelAreas: TripHotelArea[];
  travel: TripTravel;
  /** Evening places that are not parks; absent from an API that does not plan evenings yet. */
  venues?: TripVenue[];
  /** The ticket catalog; absent from an API that does not plan with tickets yet. */
  tickets?: TicketProduct[];
  /** The `hotel=` values the plan takes, `offsite` among them; absent from an older API. */
  hotels?: TripHotel[];
  /** The market codes its tickets name; absent from an older API, which meant Orlando's (`us`). */
  ticketMarkets?: TripTicketMarkets;
  /** Its storm season, the seasons it names and its climate park; absent from an older API. */
  weather?: TripWeather;
  /**
   * The cities a trip stays in (Japan, Paris), the moves between them and how both are priced;
   * absent in a region a trip sleeps in one place. The API's
   * `docs/frontend/trip-regions.md#bases-a-trip-across-several-cities`.
   */
  bases?: TripBase[];
  baseLegs?: TripBaseLeg[];
  stayRules?: TripStayRules;
}

/** A park's status on a day. `UNKNOWN` past its published hours, never `CLOSED`. */
export type TripDayStatus = 'OPERATING' | 'CLOSED' | 'UNKNOWN';

/**
 * Where a day's figures come from: the forecast (the next 60 days), the same weekday a year earlier
 * as measured (every day after them, and a gap in the forecast), the long-range outlook (after them
 * where nothing was measured a year back), or nothing.
 */
export type TripBasis = 'forecast' | 'long_range' | 'last_year' | 'none';

/**
 * A day's level against that park's own typical day. Two parks' levels say how each compares with
 * itself, never with each other: compare parks by `headlinerWait`.
 */
export type TripCrowdLevel =
  'very_low' | 'low' | 'moderate' | 'high' | 'very_high' | 'extreme' | 'unknown' | 'closed';

/** A slot beside the day guests' hours: before opening, or after their close. */
export interface TripSlot<K extends string = string> {
  kind: K;
  /** Park-local ISO with offset. */
  opensAt: string;
  closesAt: string;
  /** `season`: the feed lost the evening row and a curated season supplies it. */
  source?: 'season';
}

/** The early slot only some hotels' guests get. */
/** The evening after the day guests' close: an extension, or a separately ticketed event. */
export type TripEveningKind = 'extended_evening' | 'ticketed_event';

/** One park on one day of the region calendar. */
export interface TripParkDay {
  status: TripDayStatus;
  hoursPublished: boolean;
  /** Park-local ISO with offset. */
  opensAt?: string;
  /** The day guests' close, so a party night shows the early close. */
  closesAt?: string;
  early?: TripSlot<TripEarlyKind>;
  evening?: TripSlot<TripEveningKind>;
  crowdLevel: TripCrowdLevel;
  /**
   * The big rides' wait at their busiest: each headliner's day peak, meaned over the park's
   * headliners, rounded to five minutes, on the measured scale (the forecast times its lead factor,
   * or last year's measured day). The one figure every trip surface ranks by; a day shows
   * `shownWait`. Absent when unknown.
   */
  headlinerWait?: number;
  basis: TripBasis;
  /** The forecast unscaled, as the park's own calendar shows it; shown, never ranked. */
  forecastWait?: number;
  /** The same weekday a year back as measured; shown, never ranked. */
  lastYearWait?: number;
  /** Ids into {@link TripCalendar.seasons}. */
  seasons?: string[];
  /** The curated closure season behind a `CLOSED` day. */
  closedBy?: string;
  /** The day is shorter for the day guest than the park's usual day (a party night, a short day). */
  closesEarly?: true;
  /** When the day guests leave on such a day, park-local ISO with offset. */
  dayGuestCloseAt?: string;
}

/** Why a resort's pick is the pick: the shortest wait, or the shorter waits close early. */
export type TripBestWhy = 'shortest_wait' | 'closes_early_elsewhere';

/** One day of the region calendar, every park side by side. */
export interface TripCalendarDay {
  /** Region-local `YYYY-MM-DD`. */
  date: string;
  isHoliday: boolean;
  isSchoolVacation: boolean;
  /** Past the last stored school calendar. */
  schoolVacationUnknown?: boolean;
  /** The day's local holidays and school breaks, by name. */
  holidays?: string[];
  /** Keyed by park slug, one entry per region park. */
  parks: Record<string, TripParkDay>;
  /**
   * The day's pick per resort: group key → the slug of the open park with the lowest cost, which
   * is `headlinerWait` weighted by the day guest's hours, so a park that closes early loses to a
   * full day with a similar wait. No entry for the day trips, for a
   * resort with no figure that day, or on a `last_year` day.
   */
  best?: Record<string, string>;
  /** Per resort, why its pick won: a park with a shorter wait may close early for day guests. */
  bestWhy?: Record<string, TripBestWhy>;
  /** The day's picks were made on waits alone: no park has published its hours for it yet. */
  bestHoursUnpublished?: true;
}

/** A curated season (`park_seasons`) in the public shape, with the park it belongs to. */
export interface TripSeason {
  id: string;
  parkSlug: string;
  kind: ParkSeasonKind;
  /** The park's own brand name, never translated; absent → the label for `kind`. */
  name?: string | null;
  startDate: string;
  endDate: string;
  /** The single dates, or `null` when it runs every day of the range. */
  dates?: string[] | null;
  /** `expected` is last year's pattern, not an announcement. */
  status: ParkSeasonStatus;
  separateTicket?: boolean;
  /** `HH:MM`, park-local. */
  opensAt?: string | null;
  closesAt?: string | null;
  url?: string | null;
}

/** The calendar's frame: the window, its forecast horizon and each park's published hours. */
export interface TripCalendarMeta {
  region: string;
  timezone: string;
  from: string;
  to: string;
  computedAt: string;
  /** The last day any region park carries a forecast; absent until the warmup has run once. */
  forecastUntil?: string;
  /** Per park slug, its last published operating day (`null`: none). */
  publishedHoursUntil: Record<string, string | null>;
}

/** `GET /v1/trip-regions/:region/calendar?from=&to=`: data key, at most 92 days. */
export interface TripCalendar {
  meta: TripCalendarMeta;
  /** The region's park slugs, in the region's order. */
  parks: string[];
  days: TripCalendarDay[];
  seasons: TripSeason[];
}

/**
 * Why a day is in a park's quiet or busy set, as codes the hub translates. The API may add codes;
 * one the hub does not know is skipped, never shown raw.
 */
export type TripBestDayReason =
  | 'quietest_in_window'
  | 'weekday'
  | 'holiday_ends'
  | 'school_break'
  | 'party_night_short_hours'
  | 'extended_evening'
  | 'early_entry'
  | 'long_range'
  | 'estimate_last_year'
  | 'closes_early';

/** One day in a park's quiet or busy set. */
export interface TripBestDay {
  date: string;
  headlinerWait?: number;
  crowdLevel: TripCrowdLevel;
  /** A `last_year` day is last year's measured day, labelled so and never presented as a pick. */
  basis: TripBasis;
  reasons: string[];
}

/**
 * One park's best days in the window: the quiet end of its days, ranked on the unrounded figure and
 * hours-weighted (a party night only behind full days), so a set and never a ranking; and its two
 * busiest. A park whose days spread less than ten minutes carries `flat` instead.
 */
export interface TripParkBestDays {
  slug: string;
  /** The basis of most of the park's days in the window. */
  basis: TripBasis;
  quiet: TripBestDay[];
  busy: TripBestDay[];
  /** No day stands out: the range the park's figures stay inside. */
  flat?: { min: number; max: number };
}

/** A resort's three best dates in the window, each with the park that has the shortest lines. */
export interface TripGroupBestDays {
  key: string;
  quiet: Array<{ date: string; slug: string; headlinerWait?: number }>;
}

/** `GET /v1/trip-regions/:region/best-days?from=&to=&limit=`: data key, at most 92 days. */
export interface TripBestDays {
  meta: {
    region: string;
    timezone: string;
    from: string;
    to: string;
    computedAt: string;
    forecastUntil?: string;
  };
  parks: TripParkBestDays[];
  groups: TripGroupBestDays[];
}

/** Why a window is a good one, as codes the hub translates; an unknown one is skipped. */
export type TripWhenReason =
  | 'no_school_break'
  | 'after_holidays'
  | 'before_spring_break'
  | 'festival'
  | 'long_days'
  | 'mild_weather';

/** What to know before booking a window, as codes; an unknown one is skipped. */
export type TripWhenWarning =
  | 'school_break'
  | 'hurricane_season'
  | 'hurricane_peak'
  | 'typhoon_season'
  | 'typhoon_peak'
  | 'rainy_season'
  | 'party_nights'
  | 'hours_not_published'
  | 'estimate_last_year'
  | 'water_park_closed';

/** One trip window `/when` ranks: its dates, its plan's figure and why. */
export interface TripWhenWindow {
  rank: number;
  /** Arrival and departure, both included. */
  from: string;
  to: string;
  /** The window's plan: the mean over its park days, in minutes. */
  headlinerWait: number;
  /** The same parks' plan averaged over every window in the range. */
  rangeAverageWait: number;
  /**
   * What the ranking added for heat and the storm season, in minutes per park day; the storm's peak
   * adds its own term there. Absent when nothing.
   */
  penalties?: { heat?: number; hurricane?: number; typhoon?: number };
  /** `last_year` when every park day is last year's measured day, `mixed` when some are. */
  basis: 'forecast' | 'mixed' | 'last_year';
  reasons: string[];
  warnings: string[];
  /** Ids into {@link TripWhen.seasons}. */
  seasons: string[];
  /** Park days of the plan that close early for day guests. */
  closesEarlyDays: number;
  plan?: {
    days: Array<{ date: string; kind: string; parks: string[] }>;
    /** The chosen parks this window has no day for; present only when it leaves one out. */
    parksLeftOut?: Array<{ park: string; reason: string }>;
  };
}

/** One ISO week of the year strip: the chosen parks' mean best-park cost. */
export interface TripWhenWeek {
  /** The Monday. */
  start: string;
  headlinerWait?: number;
  basis: 'forecast' | 'mixed' | 'last_year' | 'none';
}

/** `GET /v1/trip-regions/:region/when`: data key; the best windows of a length in a range. */
export interface TripWhen {
  meta: {
    region: string;
    from: string;
    to: string;
    days: number;
    computedAt: string;
    forecastUntil?: string;
    within?: {
      code: string;
      name: string;
      periods: Array<{ from: string; to: string; name: string }>;
    };
  };
  windows: TripWhenWindow[];
  weeks: TripWhenWeek[];
  seasons: TripSeason[];
}

/**
 * How far the region's forecast of the peak wait was off, measured over the last `days` days for
 * forecasts made `leadDays` ahead (`GET /v1/trip-regions/:region/accuracy`, open). The planner's
 * „Wie genau ist das?“ uses the same measure.
 */
export interface TripForecastAccuracy {
  days: number;
  /** The measured days, region-local `YYYY-MM-DD`. */
  from: string;
  to: string;
  leadDays: number;
  /** The mean absolute error of the peak wait, minutes, unrounded. */
  maeMinutes: number;
  parks: number;
  sampleDays: number;
}

/** A month of a hub, 1-based, the way the month URLs spell it (`/orlando/2026/12`). */
export interface TripMonth {
  year: number;
  month: number;
}

/*
 * `/when`'s month rows and the open `/school-breaks` route, for the best-time pages
 * (`app/[locale]/trip-regions/[region]/best-time-to-visit`). Kept as one block at the end so the hub's own
 * types above and this block merge without touching each other.
 */

/**
 * The climate normal of a month at the region's reference park (Magic Kingdom): the long-run
 * mean of the calendar month, never a forecast. Shown as "usually", with its period.
 */
export interface TripMonthClimate {
  /** Mean daily high, °C. */
  tempMax: number;
  /** Mean daily low, °C. */
  tempMin: number;
  /** Rain over the month, mm. */
  precipitationMm: number;
  /** Days with rain in a usual month, where the API counts them. */
  rainDays?: number;
  basis: 'climate_normal';
  /** The years averaged, `2015-2024`. */
  period: string;
}

/** One month of `/when`'s range: the same day pricing as `weeks`, plus what the month holds. */
export interface TripWhenMonth {
  /** `YYYY-MM`, region-local. */
  month: string;
  /** The chosen parks' mean best-park cost over the month's days, as in `weeks`; minutes. */
  headlinerWait?: number;
  basis: 'forecast' | 'mixed' | 'last_year' | 'none';
  climate?: TripMonthClimate;
  /**
   * The region's school-break days in the month (Orange County for Orlando, Japan's own), by
   * name. Every region gets it; read it through `monthBreakDays`.
   */
  localSchoolBreakDays?: Array<{ date: string; name: string }>;
  /** The same days under their first name, sent in the US regions only. Deprecated. */
  usSchoolBreakDays?: Array<{ date: string; name: string }>;
  /** Ids into {@link TripWhen.seasons}: the chosen parks' seasons that run in the month. */
  seasons: string[];
  /** Park days of the chosen parks that close early for day guests for a ticketed event. */
  partyNights: number;
  /** Mean day-guest hours over the open days of the chosen parks, one decimal; absent unpublished. */
  dayGuestHours?: number;
  /** June to November: a fact about the season, not a forecast. */
  hurricaneSeason?: boolean;
  /** Japan's storm season, as `hurricaneSeason` is Orlando's. */
  typhoonSeason?: boolean;
  /** The month touches Japan's rainy season, a fact the ranking does not price. */
  rainySeason?: boolean;
}

/** `/when` with its month rows; `TripWhen.seasons` holds every season a window or a month names. */
export interface TripWhenWithMonths extends TripWhen {
  months: TripWhenMonth[];
}

/** One school-holiday region the holiday data knows, with its breaks in the asked range. */
export interface TripSchoolBreakRegion {
  /** The code `within` accepts, exactly as the holiday table stores it (`DE-NW`, `GB-ENG`). */
  code: string;
  name: string;
  /** ISO 3166 alpha-2. */
  country: string;
  /**
   * The last day the stored school calendar covers: a later break is unknown, not absent. Absent
   * where the data does not say (Spain's provinces).
   */
  through?: string;
  /** Each break with the weekends around it. */
  periods: Array<{ from: string; to: string; name: string }>;
}

/** `GET /v1/trip-regions/:region/school-breaks?from=&to=&countries=`: open, a day at the edge. */
export interface TripSchoolBreaks {
  regions: TripSchoolBreakRegion[];
}
