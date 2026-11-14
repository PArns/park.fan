import { API_ORIGIN } from '@/lib/api/client';
import type { PlannerOpenedSource } from '@/lib/planner/ui-store';
import type { LinkBlock } from '@/lib/analytics/internal-link';
import type { SeenSection } from '@/lib/analytics/section-seen';
import { ForegroundTimer } from '@/lib/analytics/foreground-timer';
import { analyticsOptedOut, isAnalyticsHost } from '@/lib/analytics/opt-out';
import { locales, type Locale } from '@/i18n/config';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { LIVE_TRIP_REGIONS } from '@/lib/trip-regions/registry';
import type { WhenPeriodKey } from '@/lib/trip-regions/plan-when';
import { PARK_CALENDAR_SEGMENTS } from '@/lib/parks/calendar-segments';
import { PARK_STATS_SEGMENTS } from '@/lib/parks/stats-segments';
import { PARK_KIDS_SEGMENTS } from '@/lib/parks/kids-segments';
import type { ParkyEntrance } from '@/lib/assistant/entrance';
import type { SearchTab } from '@/components/search/search-result-groups';

/**
 * Our own cookieless statistic on api.park.fan (`POST /v1/analytics/collect`): page views and
 * events, counted per day and never per reader. It carries the custom events Umami used to bill,
 * so a property here costs nothing, and the reads that feed the most-read lists.
 *
 * Beside the views and events the facade measures how long each page view was in the foreground
 * (`ForegroundTimer`): it runs while the tab is visible and reports the seconds it added, as an
 * `engagement` hit, when the next page replaces it and whenever the tab goes to the background, so
 * a tab killed on a phone has still reported. A page view reports at most half an hour in all and
 * nothing under a second. No timestamp is sent, and no performance timing of any kind. The window
 * width is not read either: the API derives the device class from the User-Agent.
 *
 * Adding an event is one call at the call site: `trackSiteEvent('my_event', { kind: 'x' })`. The
 * API takes any event name and any properties of the shapes below, so nothing there changes. The
 * events this site sends today are in {@link SiteEventMap}, and a call with one of those names is
 * checked against its properties; any other name goes through untyped.
 *
 * **What may be sent.** A property is a value chosen in our own code: a name from a list, a
 * number, a flag, the slug of a page. Never free text and never anything that identifies a person:
 * not what somebody typed into a search field or a form, not a name, an address, an e-mail, a
 * token, not a position. The facade drops what does not fit the API's patterns, and it cannot tell
 * a typed query from a slug, so that rule is the caller's. See docs/development/analytics.md.
 */

/** What kind of page a hit was sent from, derived from the path by {@link sitePageTypeOf}. */
export type SitePageType =
  | 'home'
  | 'park'
  | 'park_calendar'
  | 'park_chapter'
  | 'attraction'
  | 'geo'
  | 'guide'
  | 'guide_index'
  | 'news'
  | 'news_index'
  | 'glossary'
  | 'glossary_index'
  | 'search'
  | 'planner'
  | 'favorites'
  | 'trip_hub'
  | 'trip_month'
  | 'trip_best_time'
  | 'not_found'
  | 'other';

/**
 * Which search field a search event came from. The phone and desktop hero are both `hero`;
 * `home_steps` was the copy of the hero field in the homepage's step card, no longer sent but kept
 * so the admin can still label the events it counted. `park_rides` is the ride search on a park's attractions
 * tab, `compare` the park picker of the comparison, `glossary` the glossary overview's field,
 * `post_end` the field under a post's parks.
 */
export type SearchSurface =
  | 'hero'
  | 'header'
  | 'keyboard'
  | 'search_page'
  | 'listing_guides'
  | 'listing_news'
  | 'guides_panel'
  | 'home_steps'
  | 'park_rides'
  | 'compare'
  | 'glossary'
  | 'post_end';

/**
 * What kind of result was opened from a search. `trip_planner` is the row a query naming a trip
 * region gets first, into the region's planner.
 */
export type SearchResultKind =
  | 'park'
  | 'attraction'
  | 'show'
  | 'restaurant'
  | 'location'
  | 'glossary'
  | 'guide'
  | 'news'
  | 'trip_planner';

/** A 1-based result position, bucketed so a long list does not spread over fifty values. */
export type SearchPosition = '1' | '2' | '3' | '4-5' | '6-10' | '11+';

/** How long a query was, in characters and bucketed: the class of a query, never its text. */
export type SearchQueryLength = '1-4' | '5-8' | '9-15' | '16+';

/**
 * A menu of the header: the guides, news, parks, „Mehr", planner and favourites bands of the bar,
 * and the phone's sheet behind the burger.
 */
export type NavMenuId = 'guides' | 'news' | 'parks' | 'more' | 'planner' | 'favorites' | 'sheet';

/** What was picked from a search surface's list before anything was typed. */
export type SearchBrowseItem =
  'nearby_park' | 'in_park_ride' | 'popular_park' | 'favorite_park' | 'news' | 'guide';

/** A step of the planner's wizard, in the order it asks them. */
export type PlannerWizardStep = 'park' | 'date' | 'setup' | 'headliners';

/** What a planner block is: a ride, a show performance or a block the visitor wrote. */
export type PlanItemKind = 'ride' | 'show' | 'block';

/**
 * The control that put a block into a plan. `headliners` is the optimise row's „Alle Headliner",
 * `add_button` the ride page's „Zum Plan" (through the fit assistant too), `block_menu` the free
 * block a column or the panel adds.
 */
export type PlanItemAddSource =
  | 'search'
  | 'add_button'
  | 'drag'
  | 'missing_headliners'
  | 'show_picker'
  | 'block_menu'
  | 'wizard'
  | 'headliners'
  | 'assistant';

/** The control that took a block out: its own ✕, the action bar, the Delete key, the flat list. */
export type PlanItemRemoveSource = 'block' | 'action_bar' | 'keyboard' | 'timeline';

/**
 * What re-planned the day: „Tag optimieren", „Alle Headliner", or an answer from the fit
 * assistant. Rows from before the property have none.
 */
export type PlanOptimizeMode = 'day' | 'headliners' | 'fit';

/** Where the fit assistant opened: the optimise row, the ride page's button, the wizard's last step. */
export type PlannerFitSource = 'optimize' | 'add_button' | 'wizard';

/** A lever of the fit assistant (`FitLeverKind` in `lib/planner/fit.ts`, with underscores). */
export type PlannerFitLever = 'drop_block' | 'shorten_block' | 'drop_all_blocks';

/** Which undo put a day back: the optimise row's or the ride page button's. */
export type PlannerUndoSource = 'optimize' | 'add_button';

/** What a shared plan's link turned out to hold. */
export type SharedPlanResult = 'ready' | 'empty' | 'missing' | 'failed';

type NoProps = Record<string, never>;

/**
 * How a question reached Parky: an opener suggestion, typed, a reply chip under his answer, or the
 * planner's interview button.
 */
export type AssistantQuestionKind = 'suggestion' | 'typed' | 'chip' | 'interview';

/**
 * The greeting a chat opened with: one about the visitor's own plans (`YOURS_GREETINGS`), or one
 * of the five general ones.
 */
export type AssistantGreetingKind =
  'today' | 'yesterday' | 'tomorrow' | 'soon' | 'trip' | 'back' | 'plain';

/** A trip or a park day, as Parky's interview and his changes name a planner. */
export type AssistantPlannerKind = 'trip' | 'day';

/** An interview step as the statistic counts it; `refine` is the offer once the plan stands. */
export type AssistantInterviewStepName =
  | 'region'
  | 'dates'
  | 'parks'
  | 'party'
  | 'tickets'
  | 'hotel'
  | 'pace'
  | 'file'
  | 'day'
  | 'mustdo'
  | 'heights'
  | 'shows'
  | 'arrival';

/** What a change of Parky's did to a planner: a trip's kinds, then a day's. */
export type AssistantPlanChange =
  | 'dates'
  | 'parks'
  | 'pin'
  | 'swap'
  | 'rest'
  | 'tickets'
  | 'hotel'
  | 'pace'
  | 'route'
  | 'buffer'
  | 'file'
  | 'add'
  | 'move'
  | 'remove'
  | 'show'
  | 'party'
  | 'done'
  | 'block'
  | 'clear';

/**
 * What made Parky's window open: the round button, a line in its bubble, Parky's own page, Parky in
 * the homepage hero, or Parky himself, reopening it on the page he just switched to another
 * language.
 */
export type AssistantOpenSource = 'button' | 'line' | 'page' | 'hero' | 'language' | 'interview';

/**
 * A line in Parky's speech bubble: an invitation, after an entrance, bored, woken, a holiday's, a
 * park's own, the Konami code's, or an answer to something the visitor did (the trip planner
 * opened, a plan finished, a favourite, an alert, the theme switched, the app installed, its own
 * stop on the homepage scrolled into view), or the park's weather.
 */
export type AssistantLineKind =
  | 'invitation'
  | 'entrance'
  | 'bored'
  | 'woke'
  | 'holiday'
  | 'park'
  | 'fact'
  | 'secret'
  | 'planner'
  | 'plan'
  | 'favourite'
  | 'alert'
  | 'theme'
  | 'install'
  | 'hello'
  | 'hang'
  | 'rough'
  | 'weather'
  | 'live'
  | 'clock'
  | 'yours';

/** How one of Parky's answers ended. */
export type AssistantAnswerResult =
  'answered' | 'limit' | 'off' | 'upstream' | 'network' | 'session' | 'expired';

/** Properties of an event the facade does not know: any key, a string, a number or a flag. */
type SiteEventProps = Record<string, string | number | boolean>;

/**
 * The events this site sends and their properties. A call with one of these names is type-checked
 * against its entry; the API takes the property values of any event as they come, so a new event
 * needs no entry here, only the type-checking one gives.
 */
export interface SiteEventMap {
  search_opened: { surface: SearchSurface };
  search_typed: { surface: SearchSurface };
  search_no_results: { surface: SearchSurface; length: SearchQueryLength };
  search_result_clicked: {
    surface: SearchSurface;
    result: SearchResultKind;
    position: SearchPosition;
    /** The palette's or the hero's tab the result was listed under; a surface without tabs has none. */
    tab?: SearchTab;
  };
  search_browse_clicked: {
    surface: SearchSurface;
    item: SearchBrowseItem;
    position: SearchPosition;
  };
  search_view_all: { surface: SearchSurface };
  favorite_add: { type: 'park' | 'attraction' | 'show' | 'restaurant' };
  favorite_remove: { type: 'park' | 'attraction' | 'show' | 'restaurant' };
  nearby_permission: { result: 'granted' | 'denied' };
  nearby_parks_loaded: { type: 'nearby_parks' | 'in_park'; source: 'gps' | 'ip' };
  language_switched: { from: Locale; to: Locale };
  theme_toggled: { theme: 'light' | 'dark' | 'system' };
  tab_changed: { tab: 'attractions' | 'map' | 'shows' | 'restaurants' | 'weather' };
  location_banner_clicked: NoProps;
  blog_toast_opened: NoProps;
  glossary_term_viewed: { term: string };
  glossary_category_filtered: { category: string };
  preferred_source_clicked: NoProps;
  ride_alert_set: { source: 'card' | 'central' | 'assistant' };
  ride_alert_removed: NoProps;
  show_follow_add: { source: 'card' | 'panel' | 'assistant' };
  show_follow_remove: NoProps;
  planner_opened: { source: PlannerOpenedSource };
  /** Parky's button is on screen, once per page view; with the entrance it made, `none` without. */
  assistant_shown: { entrance: ParkyEntrance | 'none' };
  /** Parky's window went from closed to open, from the button or a line in the bubble. */
  assistant_opened: { source: AssistantOpenSource };
  /** A line appeared in Parky's speech bubble. */
  assistant_line_shown: { line: AssistantLineKind };
  /** A line in the bubble was pressed, which opens Parky. */
  assistant_line_clicked: { line: AssistantLineKind };
  /** A line was closed with its ✕, which ends the lines for the session. */
  assistant_line_closed: { line: AssistantLineKind };
  /** Parky's window closed again, with how many questions were asked while it was open. */
  assistant_closed: { questions: number };
  /**
   * A question to Parky: a suggested one, typed, a reply chip or the interview's kickoff; never its
   * text. `first` for a chat's first question, `position` the chip's place (1 the likeliest).
   */
  assistant_question: { kind: AssistantQuestionKind; first: boolean; position?: number };
  /**
   * A chat opened with its greeting: about the visitor's own plans (`yours.ts`), or `plain`. Once
   * per chat, when the window shows it; never the park or the date.
   */
  assistant_greeting: { kind: AssistantGreetingKind };
  /** How Parky's answer ended; `lookups` is the number of data lookups it made. */
  assistant_answer: { result: AssistantAnswerResult; lookups: number };
  /** Thumbs up or down for one answer. */
  assistant_rated: { rating: 'up' | 'down' };
  /** Feedback sent from Parky's window; whether an e-mail came along, never the e-mail. */
  assistant_feedback_sent: { email: boolean };
  /** The challenge in front of Parky failed in this browser. */
  assistant_challenge_failed: NoProps;
  /**
   * Reply chips were drawn under an answer; how many, never their text, and after what: an
   * interview's question, a change to a plan, or any other answer.
   */
  assistant_replies_shown: { count: number; context: 'interview' | 'plan_change' | 'answer' };
  /**
   * Parky's interview began, from the planner's button or in the chat. `region` a live trip
   * region's slug, `none` for a park day or a trip whose region is not settled yet.
   */
  assistant_interview_started: {
    kind: AssistantPlannerKind;
    source: 'planner' | 'chat';
    region: string;
  };
  /** A step of the interview was answered, or passed. */
  assistant_interview_step: {
    kind: AssistantPlannerKind;
    step: AssistantInterviewStepName;
    outcome: 'answered' | 'skipped';
    region: string;
  };
  /**
   * The interview ended: done, or left; with the steps answered, and whether its plan stood (the
   * core steps all answered or passed).
   */
  assistant_interview_ended: {
    kind: AssistantPlannerKind;
    outcome: 'done' | 'left';
    steps: number;
    plan: boolean;
    region: string;
  };
  /**
   * A change of Parky's reached a planner; what kind of change, never what it holds. One event
   * per kind: a change of dates and parks counts both.
   */
  assistant_plan_changed: { planner: AssistantPlannerKind; change: AssistantPlanChange };
  /**
   * Parky's change was taken back, or found changed by the visitor since: by the receipt's undo
   * under the answer, or by asking Parky in the chat.
   */
  assistant_change_undone: {
    planner: AssistantPlannerKind;
    outcome: 'undone' | 'changed';
    via: 'receipt' | 'chat';
  };
  /**
   * A park and date got their first block; `source` is the way into the opening it happened in,
   * `none` with the panel shut. The park's UUID as entity where a page named it.
   */
  plan_day_started: { source: PlannerOpenedSource | 'none' };
  plan_optimized: { mode: PlanOptimizeMode };
  planner_closed_empty: NoProps;
  /** A wizard step on screen, the first time in an opening; the park as entity once picked. */
  planner_wizard_step: { step: PlannerWizardStep };
  /** The wizard's last press, with whether it planned the headliners; the park as entity. */
  planner_wizard_finished: { headliners: boolean };
  /** A block went into a plan; a ride's or show's UUID as entity where a page named it. */
  plan_item_added: { kind: PlanItemKind; source: PlanItemAddSource };
  /** A block came out of a plan, one at a time; the same entity as when it went in. */
  plan_item_removed: { kind: PlanItemKind; source: PlanItemRemoveSource };
  /** The fit assistant opened for a day that does not hold everything; the park as entity. */
  planner_fit_opened: { source: PlannerFitSource };
  /** A lever of the fit assistant switched on (switching it off again is not counted). */
  planner_fit_lever: { lever: PlannerFitLever };
  /** A day put back as it was before the last optimisation or assistant answer; the park as entity. */
  planner_undo: { source: PlannerUndoSource };
  /** A whole day dropped from the plan; the park as entity. */
  planner_day_cleared: NoProps;
  /** A shared plan's link opened and its answer arrived. */
  planner_shared_opened: { outcome: SharedPlanResult };
  /** A shared plan taken over into this browser. */
  planner_shared_adopted: NoProps;
  /** Push for the plan switched on and accepted by the API. */
  planner_push_on: NoProps;
  attraction_filter_used: {
    filter:
      | 'open'
      | 'off_season'
      | 'wet'
      | 'fast_pass'
      | 'single_rider'
      | 'covered'
      | 'height'
      | 'sort_wait';
  };
  covered_ride_opened: NoProps;
  compass_viewed: NoProps;
  compass_heading_on: NoProps;
  compass_ride_pinned: NoProps;
  compass_ride_opened: { from: 'bar' | 'list' };
  compass_pill_clicked: NoProps;
  outbound_link_clicked: { target: 'park_website' | 'tickets' | 'maps' | 'other' };
  pwa_installed: NoProps;
  /** The homepage's Parky stop scrolled into the middle of the screen, once a page view. */
  home_parky_seen: NoProps;
  /** A post, park or ride that was read: five seconds in front. A post is named by its key. */
  page_read: { kind: 'article' | 'news'; key: string } | { kind: 'park' | 'attraction' };
  /** How far down a guide or news post the reader got, once per depth. */
  article_read: { depth: 25 | 50 | 75 | 100 };
  calendar_day_opened: NoProps;
  calendar_month_changed: { direction: 'previous' | 'next' | 'current' };
  push_permission: { result: 'granted' | 'denied' | 'dismissed' };
  error_shown: { boundary: 'page' | 'maintenance' | 'global' };
  /**
   * A share button pressed: the planner's link, or the system share sheet, a network or the copy
   * button of a share row.
   */
  share_clicked: { target: 'trip_plan' | 'native' | 'whatsapp' | 'facebook' | 'x' | 'link' };
  /**
   * A link to another page of the site opened from a marked block (`lib/analytics/internal-link.ts`):
   * the block, the kind of page it leads to and its place among the block's destinations. The
   * park's or ride's UUID as entity where a card names it.
   */
  internal_link_clicked: { block: LinkBlock; dest: SitePageType; position: SearchPosition };
  /**
   * A marked place on a park page came on screen, once per page view and place; the planner tile
   * and the planner band count their views the same way.
   */
  section_seen: { section: SeenSection };
  /** A header menu band or the phone menu opened, hover included; once per opening. */
  nav_menu_opened: { menu: NavMenuId };
  /** A question of an FAQ opened; `position` is its 1-based place in the list. */
  faq_opened: { position: number };
  /** The „Mehr" flyout of a park's title card opened, with the park's outbound links. */
  park_links_opened: NoProps;
  /**
   * A link of the planner tile on a park's pages followed, middle click included: the plan with the
   * park chosen, or the region's crowd calendar. The park as entity. `internal_link_clicked` counts
   * the same click under the block `trip_tile`, where both links are one place (one page).
   */
  trip_tile_clicked: TripEvent<{ link: TripTileLink }>;
  /**
   * The trip planner started: the hub's hero, its own start button, a link with a plan, or (`dates`)
   * the first dates picked in a page load where nothing else started it, the desk's usual way in.
   */
  trip_planner_started: TripEvent<{ source: 'hero' | 'button' | 'link' | 'dates' }>;
  /**
   * The ticket question before PAR-1309: no longer sent, kept for the history it counted. Its
   * successor is `trip_tickets_opened`.
   */
  trip_tickets_answered: TripEvent<{ answer: 'not_yet' | 'yes' | 'skipped' }>;
  /**
   * The ticket step opened, every time: from "Already have tickets?" (`ask`), the card's "Change"
   * (`card`), a ticket problem or a day outside a ticket; `first` the first time in this browser.
   */
  trip_tickets_opened: TripEvent<{ from: TripTicketsFrom; first: boolean }>;
  /**
   * A change opened from where the visitor stood: Dates, Parks, the Route or More options, from the
   * answer's buttons, the setup's rows and disclosures, the parks left out or a ticket problem.
   */
  trip_edit_opened: TripEvent<{ panel: TripEditPanel; from: TripEditFrom }>;
  /**
   * One option of the plan changed, by the visitor or by Parky (who also counts his own change as
   * `assistant_plan_changed`). `value` only where the set is small and closed: a buffer's minutes,
   * the rest rule, on/off, a hotel kind, set/open for a gateway, added/removed for the parks.
   */
  trip_option_changed: TripEvent<{
    option: TripOption;
    value?: string;
    by: 'visitor' | 'parky';
  }>;
  /** One of the three ways out when parks did not fit, with how many were left out. */
  trip_left_out_fix: TripEvent<{
    fix: 'travel_days' | 'parks' | 'longer';
    left_out: '1' | '2' | '3+';
  }>;
  /** "No dates yet? Find the best time" and its way back. */
  trip_find_toggled: TripEvent<{ to: 'find' | 'known' }>;
  /**
   * The search's period chosen, and whether it keeps to school holidays. Never which holidays:
   * a holiday region says where the visitor lives.
   */
  trip_find_period: TripEvent<{ period: WhenPeriodKey; school_breaks: boolean }>;
  /** The date grid's resort switch, on a change; `from_default` when it left the default view. */
  trip_calendar_mode: TripEvent<{ mode: string; from_default: boolean }>;
  /** "How accurate is this?" opened under the plan. */
  trip_accuracy_opened: TripEvent<{ surface: 'plan' }>;
  /**
   * The API's suggestion for the nights (`staySuggestion`): on screen, once per suggestion, and
   * taken with "Plan it this way".
   */
  trip_stay_suggestion: TripEvent<{ action: 'shown' | 'applied' }>;
  /** A ticket chosen in the step, by its entry in the list, from the list or the Combo Ticket. */
  trip_ticket_added: TripEvent<{ entry: string; resort: string; via: 'picker' | 'combo' }>;
  /** A ticket taken out of the step. */
  trip_ticket_removed: TripEvent<{ entry: string; resort: string }>;
  /** A ticket's first day picked or left open. */
  trip_ticket_start: TripEvent<{ entry: string; resort: string; start: 'set' | 'open' }>;
  /**
   * A plan or a search for dates asked for, once the controls are still: the mode, the trip's
   * length as a bucket, how many parks (0: the headliners), owned tickets or none, how many of the
   * region's resorts plan first gives a hopper (none, some, all), resort blocks and the rest rule.
   * With the region that is eight, the limit.
   */
  trip_plan_requested: TripEvent<{
    mode: 'dates' | 'when';
    days: TripDaysBucket;
    parks: number;
    tickets: 'none' | 'owned';
    hopper: 'none' | 'some' | 'all';
    blocks: 'default' | 'on' | 'off';
    rest: 'auto' | 'none' | 'max';
  }>;
  /**
   * The answer to it on screen: `ok`, `relaxed` with the first rule it loosened, or `error` with
   * the status (0: no answer); the parks it could not place, or the windows a search found.
   */
  trip_plan_shown: TripEvent<{
    mode: 'dates' | 'when';
    outcome: 'ok' | 'relaxed' | 'error';
    relaxed?: 'blocks' | 'streak' | 'ticket_window';
    status?: number;
    unplaced?: number;
    /** The chosen parks with no day at all (`parksLeftOut`), apart from dropped second visits. */
    left_out?: number;
    /** The cities a plan across cities sleeps in; absent in a region without bases. */
    stays?: number;
    windows?: number;
  }>;
  /** "Plan these dates" on a window the search found, by its rank. */
  trip_window_planned: TripEvent<{ rank: number }>;
  /** "Ticket details" opened: in a sheet on a phone, in place at a desk. */
  trip_ticket_details_opened: TripEvent<{ surface: 'sheet' | 'inline' }>;
  /** "Show the plan with Park Hopper" for one resort, and its way back. */
  trip_hopper_toggled: TripEvent<{ resort: string; on: boolean }>;
  /** "Use these as your tickets": the suggestions became owned tickets. */
  trip_tickets_adopted: TripEvent<{ count: number }>;
  /** "Plan with these": the 14-day tickets sold outside the US for a long trip. */
  trip_long_stay_used: TripEvent<{ count: number }>;
  /** The result's view switched. */
  trip_view_changed: TripEvent<{ view: 'agenda' | 'week' | 'month' }>;
  /** A day's sheet opened, from the answer's list or a view. */
  trip_day_opened: TripEvent<{
    kind: 'arrival' | 'park' | 'hop' | 'rest' | 'departure' | 'travel';
    view: 'list' | 'agenda' | 'week' | 'month';
  }>;
  /** A day pinned or released. */
  trip_day_pinned: TripEvent<{ pinned: boolean }>;
  /** Two days swapped. */
  trip_day_swapped: TripEvent;
  /** "Plan this day": a day handed to the day planner. */
  trip_day_sent: TripEvent;
  /** "Add all days to my planner", with how many park days went in. */
  trip_days_saved: TripEvent<{ days: number }>;
  /** The trip as an `.ics` file, with its park days. */
  trip_ics_exported: TripEvent<{ days: number }>;
  /** "Copy link" of the plan. */
  trip_link_copied: TripEvent;
  /** An evening venue's own page opened from a day's evening. */
  trip_evening_link_clicked: TripEvent;
  /** A day outside its ticket's window, and the way out the visitor chose. */
  trip_outside_ticket_action: TripEvent<{ action: 'leave_out' | 'change_ticket' }>;
  /**
   * A purchase link of the trip planner's ticket catalog followed, middle click included: which
   * product, at which seller and host, what kind of link, where in the shown list (1-based),
   * whether it was ordered first for the visitor's locale or market, on which surface and with
   * which tickets the plan was made. No entity: no single park is meant. Eight properties, the
   * limit, so no `region`: the product's slug belongs to one region's catalog.
   */
  ticket_link_clicked: {
    product: string;
    seller: string;
    host: string;
    kind: TicketLinkKind;
    position: number;
    locale_match: boolean;
    surface: TicketLinkSurface;
    ticket_mode: TicketMode;
  };
}

/**
 * A trip planner event's properties: the region it plans, by slug (`orlando`), and its own. Every
 * `trip_*` event carries the region, so one statistic can tell the regions apart.
 */
type TripEvent<Props extends object = object> = { region: string } & Props;

/** Which of the planner tile's two links: into the planner, or to the region's crowd calendar. */
export type TripTileLink = 'plan' | 'calendar';

/** Where the ticket step was opened from. */
export type TripTicketsFrom = 'ask' | 'card' | 'adopt' | 'ticket_problem' | 'outside_ticket';

/** A panel of the planner's setup a change opens. */
export type TripEditPanel = 'dates' | 'parks' | 'route' | 'options';

/**
 * Where a change was opened from: the answer's buttons, the setup, the parks left out, a ticket
 * problem, or the ticket card (a ticket that covers none of the planned parks).
 */
export type TripEditFrom = 'answer' | 'setup' | 'left_out' | 'ticket_problem' | 'ticket_card';

/** An option of the plan `trip_option_changed` names: the query's own fields, grouped. */
export type TripOption =
  | 'hotel'
  | 'area'
  | 'arrival'
  | 'departure'
  | 'rest'
  | 'split'
  | 'evenings'
  | 'hop'
  | 'blocks'
  | 'fireworks'
  | 'parks'
  | 'visits'
  | 'cities'
  | 'nights'
  | 'stay_area'
  | 'start_base'
  | 'end_base'
  | 'move_buffer';

/** A trip's length as a bucket, arrival and departure included. */
export type TripDaysBucket = '1-4' | '5-7' | '8-10' | '11-14' | '15-21';

/** What a ticket purchase link is: the operator's own shop, an affiliate one, or another seller. */
export type TicketLinkKind = 'official' | 'sponsored' | 'plain';
/** Where a ticket purchase link was: a suggestion's details, the 14-day alternatives, an owned ticket. */
export type TicketLinkSurface = 'suggestion' | 'long_stay' | 'owned';
/** Which tickets a trip plan was made with: none owned, all owned, or both. */
export type TicketMode = 'plan_first' | 'owned' | 'mixed';

/** The name of an event the API accepts. */
export type SiteEventName = keyof SiteEventMap;

/** The pills of the park page's filter panel, plus the rider-height slider. Closed on purpose. */
export type AttractionFilterName = SiteEventMap['attraction_filter_used']['filter'];

interface HitBase {
  locale: Locale;
  path: string;
  /** Any string the API's pattern admits; the facade sends {@link SitePageType}. */
  pageType: string;
}

type CollectHit =
  | (HitBase & { t: 'pageview'; referrer?: string; source?: string })
  | (HitBase & {
      t: 'event';
      name: string;
      props?: SiteEventProps;
      entity?: string;
    })
  /** Foreground seconds a page view added since its last report; no timestamp goes with it. */
  | (HitBase & { t: 'engagement'; seconds: number });

const COLLECT_URL = `${API_ORIGIN}/v1/analytics/collect`;
const MAX_HITS_PER_REQUEST = 20;
const FLUSH_DELAY_MS = 1000;
/**
 * How long a page load's first flush waits for its pageview. A page's own events can be queued
 * before the layout's beacon has run, and the API attaches an event to a visit only once the
 * visit's first pageview has opened it, so an event that left first would count without a channel.
 */
const FIRST_PAGEVIEW_WAIT_MS = 3000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const REFERRER_PATTERN = /^[a-z0-9][a-z0-9.-]{0,99}$/;
/**
 * The `utm_source` values sent as `source` when no referrer came: the hosts of the AI assistants the
 * API's `REFERRER_RULES` (`src/site-analytics/referrer.util.ts`) put in the `ai` channel. ChatGPT
 * tags its links `utm_source=chatgpt.com` and often sends no referrer, so those visits counted as
 * direct. A value outside this list and {@link SOCIAL_SOURCE_HOSTS}, and every other part of the
 * query string, is never read.
 */
const AI_SOURCE_HOSTS: ReadonlySet<string> = new Set([
  'chatgpt.com',
  'chat.openai.com',
  'perplexity.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'claude.ai',
  'meta.ai',
  'grok.com',
  'deepseek.com',
  'chat.mistral.ai',
  'you.com',
  'phind.com',
]);
/**
 * The `utm_source` spellings park.fan's own Instagram and Facebook links carry, each with the host
 * sent as `source`, one the API's `REFERRER_RULES` put in the `social` channel. Instagram's in-app
 * browser, and the apps a story or bio link opens in, send no referrer, so without the tag those
 * visits count as direct.
 */
const SOCIAL_SOURCE_HOSTS: ReadonlyMap<string, string> = new Map([
  ['instagram', 'instagram.com'],
  ['instagram.com', 'instagram.com'],
  ['l.instagram.com', 'instagram.com'],
  ['facebook', 'facebook.com'],
  ['facebook.com', 'facebook.com'],
  ['m.facebook.com', 'facebook.com'],
]);
/**
 * Phone systems a User-Agent names, with the platform the engine itself reports for them in
 * `navigator.userAgentData`. A headless browser dressed up as a phone reports itself visible and
 * passes every other gate, but its engine still names the system it really runs on. No iOS
 * browser built on WebKit has `userAgentData`, so on an iPhone the check never fires.
 */
const CLAIMED_PLATFORMS: readonly (readonly [RegExp, string])[] = [
  [/\b(?:iPhone|iPad|iPod)\b/, 'iOS'],
  [/\bAndroid\b/, 'Android'],
];
const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]{1,47}$/;
const PROP_KEY_PATTERN = /^[a-z][a-z0-9_]{0,31}$/;
/** A text value: a letter or digit first, then letters, digits and a few separators, 120 at most. */
const PROP_VALUE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._:/+#-]{0,119}$/u;
const MAX_PROPS = 8;
/** What the API accepts as a path; a hit outside it is dropped there, so it is not sent at all. */
const PATH_PATTERN = new RegExp(`^/(${locales.join('|')})(/[a-z0-9][a-z0-9._~-]{0,99}){0,8}$`);

/** Every locale's spelling of a segment: a page is served on its own locale's, and on none else. */
const spellings = (segments: Record<Locale, string>) => new Set(Object.values(segments));
const CALENDAR_SEGMENTS = spellings(PARK_CALENDAR_SEGMENTS);
const PARK_CHAPTER_SEGMENTS = new Set([
  ...spellings(PARK_STATS_SEGMENTS),
  ...spellings(PARK_KIDS_SEGMENTS),
]);
const GLOSSARY_SEGMENT_SET = spellings(GLOSSARY_SEGMENTS);
const PLANNER_SEGMENT_SET = spellings(PLANNER_SEGMENTS);
/** The live trip regions' hub segments in every locale (`/de/orlando`, `/fr/japon`). */
const TRIP_REGION_SEGMENT_SET = new Set(
  LIVE_TRIP_REGIONS.flatMap((region) => Object.values(region.segments))
);
const BEST_TIME_SEGMENT_SET = spellings(BEST_TIME_SEGMENTS);
/** A region's month page: `/de/orlando/2026/12`. */
const TRIP_MONTH_YEAR = /^\d{4}$/;
/** The blog's own listing paths: `/blog/page/2`, `/blog/category/…`, `/blog/tag/…`, `/blog/authors/…`. */
const BLOG_LISTING_SEGMENTS = new Set(['page', 'category', 'tag', 'authors']);

const queue: CollectHit[] = [];
let flushTimer: ReturnType<typeof setTimeout> | undefined;
let holdTimer: ReturnType<typeof setTimeout> | undefined;
/** This load's first pageview is queued, or its wait for it is over: flushing may begin. */
let released = false;
let referrerSent = false;
let lifecycleHooked = false;
/** This load has been on screen at least once; until then nothing it queued leaves. */
let seenOnScreen = false;
/** A pageview asked for while the page was off screen, counted once it comes on screen. */
let pageviewWaiting = false;
/** The page view now open, whose foreground time is measured, until the next one replaces it. */
let openPage: { base: HitBase; timer: ForegroundTimer } | undefined;
/** The path the not-found page has declared itself for, until the next navigation. */
let notFoundPath: string | undefined;

/**
 * The page type of a locale-prefixed path such as `/de/parks/europe/germany/bruehl/phantasialand`.
 * A park is five segments under `/parks`; one more is a ride unless it names a park sub-page, and
 * those, like the glossary and the planner, are written in the reader's language
 * (`/de/parks/…/phantasialand/wartezeiten-kalender`, `/de/tagesplaner`). A live trip region's hub
 * is its segment (`/de/orlando`, `trip_hub`), its months follow with a year (`trip_month`) and its
 * best-time pages with the best-time segment (`trip_best_time`).
 */
export function sitePageTypeOf(pathname: string): SitePageType {
  const [, ...segments] = pathname.toLowerCase().split('/').filter(Boolean);
  const [first, second] = segments;
  if (!first) return 'home';
  if (first === 'parks') {
    if (segments.length < 5) return 'geo';
    if (segments.length === 5) return 'park';
    if (CALENDAR_SEGMENTS.has(segments[5])) return 'park_calendar';
    if (PARK_CHAPTER_SEGMENTS.has(segments[5])) return 'park_chapter';
    return segments.length === 6 ? 'attraction' : 'other';
  }
  if (first === 'blog') {
    return second && !BLOG_LISTING_SEGMENTS.has(second) ? 'guide' : 'guide_index';
  }
  if (first === 'news') return second && second !== 'page' ? 'news' : 'news_index';
  if (GLOSSARY_SEGMENT_SET.has(first)) return second ? 'glossary' : 'glossary_index';
  if (first === 'search') return 'search';
  if (PLANNER_SEGMENT_SET.has(first)) return 'planner';
  if (first === 'favorites') return 'favorites';
  if (TRIP_REGION_SEGMENT_SET.has(first)) {
    if (!second) return 'trip_hub';
    if (BEST_TIME_SEGMENT_SET.has(second)) return 'trip_best_time';
    if (TRIP_MONTH_YEAR.test(second)) return 'trip_month';
  }
  return 'other';
}

/** The bucket of a query's length, counted after trimming. */
export function searchQueryLength(query: string): SearchQueryLength {
  const length = query.trim().length;
  if (length <= 4) return '1-4';
  if (length <= 8) return '5-8';
  if (length <= 15) return '9-15';
  return '16+';
}

/** The bucket of a 1-based result position. */
export function searchPosition(position: number): SearchPosition {
  if (position <= 1) return '1';
  if (position === 2) return '2';
  if (position === 3) return '3';
  if (position <= 5) return '4-5';
  if (position <= 10) return '6-10';
  return '11+';
}

/**
 * The team testing on its own phones (`?sim=` moves the reader, `?state=` patches the park) is not
 * a visitor, so none of it is counted. Read from the URL, because `isSimulationEnabled()` in the
 * browser only ever says yes under `next dev`. Decided on the first call of a page load, so a real
 * visitor who later lands on a `?state=` URL is still counted and a test visit that navigates
 * away does not start counting.
 */
const simulatedLoads = new WeakMap<object, boolean>();
function isSimulatedVisit(): boolean {
  let simulated = simulatedLoads.get(window);
  if (simulated === undefined) {
    const params = new URLSearchParams(location.search);
    simulated = params.has('sim') || params.has('state');
    simulatedLoads.set(window, simulated);
  }
  return simulated;
}

/**
 * Whether this tab may send anything: production hosts only, not from automation, a forged phone
 * or a simulated visit, not under Do Not Track, Global Privacy Control or the privacy page's
 * opt-out. For a caller that would otherwise start work (a timer, a listener) whose result nothing
 * would send.
 */
export function canCountSite(): boolean {
  if (typeof window === 'undefined') return false;
  if (!isAnalyticsHost(location.hostname)) return false;
  return (
    !navigator.webdriver && !hasForgedPlatform() && !analyticsOptedOut() && !isSimulatedVisit()
  );
}

/** The User-Agent names a phone system that the engine's own `userAgentData` contradicts. */
function hasForgedPlatform(): boolean {
  const { userAgentData } = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = userAgentData?.platform;
  if (!platform || platform === 'Unknown') return false;
  const claimed = CLAIMED_PLATFORMS.find(([pattern]) => pattern.test(navigator.userAgent ?? ''));
  return claimed !== undefined && claimed[1] !== platform;
}

/**
 * Whether the page is on screen now: not a background tab, not prerendered ahead of a click. The
 * first time it is, the load counts as seen.
 */
function noteOnScreen(): boolean {
  const { prerendering } = document as Document & { prerendering?: boolean };
  if (prerendering || document.visibilityState !== 'visible') return false;
  seenOnScreen = true;
  return true;
}

function currentBase(): HitBase | null {
  const path = location.pathname.toLowerCase().replace(/\/+$/, '');
  if (!PATH_PATTERN.test(path)) return null;
  const locale = path.split('/')[1] as Locale;
  return {
    locale,
    path,
    pageType: notFoundPath === path ? 'not_found' : sitePageTypeOf(path),
  };
}

/**
 * The host of the page that linked here as `referrer`, when it is another site, else the AI
 * assistant or social network the link's `utm_source` names as `source`. Read once per load, since
 * later pageviews of the tab are internal.
 */
function pageLoadOrigin(): { referrer?: string; source?: string } {
  if (referrerSent) return {};
  referrerSent = true;
  const host = externalReferrerHost();
  if (host) return REFERRER_PATTERN.test(host) ? { referrer: host } : {};
  const source = utmSourceHost();
  return source ? { source } : {};
}

/** The host in `document.referrer` without `www.`, or '' for none, this site or no URL at all. */
function externalReferrerHost(): string {
  try {
    const host = new URL(document.referrer).hostname.toLowerCase().replace(/^www\./, '');
    return host !== location.hostname.replace(/^www\./, '') ? host : '';
  } catch {
    return '';
  }
}

/**
 * The host the address's `utm_source` names: itself when it is one of {@link AI_SOURCE_HOSTS}, the
 * network's host for a spelling in {@link SOCIAL_SOURCE_HOSTS}, else ''.
 */
function utmSourceHost(): string {
  const value = (new URLSearchParams(location.search).get('utm_source') ?? '')
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');
  if (AI_SOURCE_HOSTS.has(value)) return value;
  return SOCIAL_SOURCE_HOSTS.get(value) ?? '';
}

function send(hits: CollectHit[], viaBeacon: boolean) {
  const body = JSON.stringify({ v: 1, hits });
  if (
    viaBeacon &&
    navigator.sendBeacon?.(COLLECT_URL, new Blob([body], { type: 'text/plain;charset=UTF-8' }))
  ) {
    return;
  }
  fetch(COLLECT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {});
}

/**
 * Sends what is queued now instead of in a second. The page does it on its own when it is hidden;
 * this is for a caller that cannot wait for that, such as a test.
 */
export function flushSiteAnalytics(): void {
  flush();
}

function flush(viaBeacon = false) {
  clearTimeout(flushTimer);
  clearTimeout(holdTimer);
  flushTimer = undefined;
  holdTimer = undefined;
  if (!seenOnScreen) return;
  while (queue.length > 0) send(queue.splice(0, MAX_HITS_PER_REQUEST), viaBeacon);
}

/**
 * The page goes to the background or away: what it spent in the foreground is reported now, and
 * everything queued leaves with it, by beacon, since a tab can be killed on a phone without another
 * chance. Reported each time it is hidden, so a page that comes back counts from there.
 */
function onPageHidden() {
  openPage?.timer.pause();
  // A load nobody looked at counts nothing, not even the events its page sent while it loaded.
  if (!seenOnScreen) {
    queue.length = 0;
    return;
  }
  reportEngagement();
  flush(true);
}

/** The page came on screen: a pageview that waited for it counts now, an open one counts on. */
function onPageShown() {
  if (!noteOnScreen()) return;
  if (pageviewWaiting) trackSitePageview();
  else openPage?.timer.resume();
}

function hookPageLifecycle() {
  if (lifecycleHooked) return;
  lifecycleHooked = true;
  // A hit queued just before the tab goes away would otherwise be lost with the timer.
  addEventListener('pagehide', onPageHidden);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onPageHidden();
    else onPageShown();
  });
  // A prerendered page the reader opens comes on screen here.
  document.addEventListener('prerenderingchange', onPageShown);
}

/** Queues the foreground seconds the open page view added since its last report, if any. */
function reportEngagement(at = queue.length): boolean {
  if (!openPage || !canCountSite()) return false;
  const seconds = openPage.timer.take();
  if (seconds < 1) return false;
  enqueue({ t: 'engagement', ...openPage.base, seconds }, at);
  return true;
}

function enqueue(hit: CollectHit, at = queue.length) {
  queue.splice(at, 0, hit);
  hookPageLifecycle();
  noteOnScreen();
  if (hit.t === 'pageview') released = true;
  if (!released) {
    holdTimer ??= setTimeout(() => {
      released = true;
      flush();
    }, FIRST_PAGEVIEW_WAIT_MS);
    return;
  }
  clearTimeout(holdTimer);
  holdTimer = undefined;
  if (queue.length >= MAX_HITS_PER_REQUEST) flush();
  else if (flushTimer === undefined) flushTimer = setTimeout(() => flush(), FLUSH_DELAY_MS);
}

/**
 * Where a pageview of `path` goes in the queue: ahead of the events that page queued while it
 * mounted. Its effects run before the layout's beacon, and the API attaches an event to a visit
 * only once the visit's first pageview has opened it, so a landing page's own events (the search
 * page's opening, a glossary term) would otherwise count without a channel or a referrer.
 */
function pageviewSlot(path: string): number {
  let at = queue.length;
  while (at > 0 && queue[at - 1].t === 'event' && queue[at - 1].path === path) at--;
  return at;
}

/**
 * Counts a view of the page now in the address bar. Call once per navigation. The view before it
 * ends here, so the foreground time it has not reported yet is queued ahead of the new pageview,
 * under the path and page type it was opened with. A page in a background tab or prerendered
 * ahead of a click is counted when it comes on screen, and never if it does not.
 */
export function trackSitePageview(): void {
  try {
    if (!canCountSite()) return;
    hookPageLifecycle();
    pageviewWaiting = !noteOnScreen();
    if (pageviewWaiting) return;
    const base = currentBase();
    const at = base ? pageviewSlot(base.path) : queue.length;
    const reported = reportEngagement(at);
    openPage = undefined;
    if (!base) return;
    openPage = {
      base,
      timer: new ForegroundTimer(() => performance.now(), document.visibilityState !== 'hidden'),
    };
    enqueue({ t: 'pageview', ...base, ...pageLoadOrigin() }, reported ? at + 1 : at);
  } catch {
    // A statistic never breaks the page.
  }
}

/**
 * Declares the page in the address bar a "not found" page, which only that page knows: its
 * pageview becomes `not_found`, whether it was queued already or comes after. A 404 renders inside
 * the layout, so the beacon cannot tell it from any other page.
 */
export function markPageNotFound(): void {
  try {
    const path = location.pathname.toLowerCase().replace(/\/+$/, '');
    notFoundPath = path;
    for (const hit of queue) {
      if (hit.t !== 'event' && hit.path === path) hit.pageType = 'not_found';
    }
    if (openPage?.base.path === path) openPage.base.pageType = 'not_found';
  } catch {
    // A statistic never breaks the page.
  }
}

/** The properties the API would keep: at most eight, keys and text values in its patterns. */
function cleanProps(props: unknown): SiteEventProps | undefined {
  if (!props || typeof props !== 'object') return undefined;
  const clean: SiteEventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (Object.keys(clean).length >= MAX_PROPS) break;
    if (!PROP_KEY_PATTERN.test(key)) continue;
    if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
      clean[key] = value;
    } else if (typeof value === 'string' && PROP_VALUE_PATTERN.test(value)) {
      clean[key] = value;
    }
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

/** The arguments after the name: the properties, typed for an event this site sends, and the entity. */
type TrackArguments<Name extends string> = Name extends SiteEventName
  ? SiteEventMap[Name] extends NoProps
    ? [props?: SiteEventMap[Name], entity?: string | null]
    : [props: SiteEventMap[Name], entity?: string | null]
  : [props?: SiteEventProps, entity?: string | null];

/** Hears an event the page reports, with its name and properties as they were passed. */
export type SiteEventListener = (name: string, props: SiteEventProps | undefined) => void;

const siteEventListeners = new Set<SiteEventListener>();

/**
 * A browser check's window onto the events, which are never sent off the production hosts: a page
 * that starts with `window.__parkfanEventLog` as an array (only a test's init script makes one)
 * gets every reported event appended to it. Nothing else reads it, and nothing leaves the page.
 */
if (typeof window !== 'undefined') {
  const log = (window as Window & { __parkfanEventLog?: unknown }).__parkfanEventLog;
  if (Array.isArray(log)) siteEventListeners.add((name, props) => log.push({ name, props }));
}

/**
 * Hears every event the page reports, counted or not (a visitor who opted out, a bot), for what
 * answers what a visitor does: Parky reacts to a few of them. The events already mark those
 * moments in every component, so nothing has to be wired twice. Returns the unsubscribe.
 */
export function onSiteEvent(listener: SiteEventListener): () => void {
  siteEventListeners.add(listener);
  return () => {
    siteEventListeners.delete(listener);
  };
}

/**
 * Counts one event on the current page. A name in {@link SiteEventMap} is checked against its
 * properties; any other name (lower case, digits and underscores, two to 48 characters) goes
 * through with any properties of {@link SiteEventProps}. `entity` is the UUID of the park, ride,
 * show or restaurant the event is about. A name, property or entity that does not fit the API's
 * patterns is left out, and nothing here throws. Never pass free text or anything that identifies
 * a person.
 */
export function trackSiteEvent<Name extends string>(
  name: Name,
  ...[props, entity]: TrackArguments<Name>
): void {
  for (const listener of siteEventListeners) {
    try {
      listener(name, props as SiteEventProps | undefined);
    } catch {
      // Whoever listens never breaks the page or the count.
    }
  }
  try {
    if (!canCountSite() || !EVENT_NAME_PATTERN.test(name)) return;
    const base = currentBase();
    if (!base) return;
    const id = entity?.toLowerCase();
    const clean = cleanProps(props);
    enqueue({
      t: 'event',
      ...base,
      name,
      ...(clean && { props: clean }),
      ...(id && UUID_PATTERN.test(id) && { entity: id }),
    });
  } catch {
    // A statistic never breaks the page.
  }
}
