/**
 * The iOS app's App ID: team `KC5QAXDX94`, bundle `fan.park.app` (the app repo's
 * `ios/Runner.xcodeproj`). Public by design: Apple reads it from the association file.
 */
export const IOS_APP_ID = 'KC5QAXDX94.fan.park.app';

/** A path and every locale's copy of it (`/de/parks/…`): the app reads the prefix and drops it. */
const localized = (path: string): string[] => [path, `/??${path}`];

/**
 * Pages under an included path that the app has no screen for; they stay in the browser. Apple
 * takes the first component that matches, so these come before the includes.
 */
const EXCLUDED_PATHS = [
  '/api/*',
  '/admin*',
  ...localized('/account*'),
  ...localized('/login*'),
  ...localized('/parks/longest-wait-times*'),
  ...localized('/parks/*/*/longest-wait-times*'),
  ...localized('/parks/six-flags*'),
  ...localized('/parks/universal*'),
  ...localized('/news/page/*'),
  ...localized('/blog/page/*'),
  ...localized('/blog/tag/*'),
  ...localized('/blog/category/*'),
  ...localized('/blog/authors/*'),
  ...localized('/blog/feed.xml'),
  ...localized('/trip-planner/*'),
];

/**
 * The pages the app opens itself: the home page, the park tree (country, park, ride, calendar,
 * statistics, with kids), news and guides, favourites, Parky and the day planner. The app's
 * `pushLocation` (`lib/data/web_link.dart` there) maps each one to its screen and hands any path
 * it has no screen for back to the website.
 */
const APP_PATHS = [
  '/',
  '/??',
  ...localized('/parks'),
  ...localized('/parks/*'),
  ...localized('/news'),
  ...localized('/news/*'),
  ...localized('/blog'),
  ...localized('/blog/*'),
  ...localized('/favorites'),
  ...localized('/parky'),
  ...localized('/trip-planner'),
];

/**
 * `/.well-known/apple-app-site-association`: which park.fan links iOS opens in the app (universal
 * links, the app's `applinks:park.fan` entitlement). Every path not named here stays in Safari.
 */
export function appleAppSiteAssociation() {
  return {
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            ...EXCLUDED_PATHS.map((path) => ({ '/': path, exclude: true })),
            ...APP_PATHS.map((path) => ({ '/': path })),
          ],
        },
      ],
    },
  };
}
