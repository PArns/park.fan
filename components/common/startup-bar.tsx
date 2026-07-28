import { STARTUPBAR_ENABLED } from '@/lib/config/features';

/**
 * StartupBar promo bar (startupbar.co).
 *
 * A 36 px iframe the vendor's loader pins to the very top of the viewport. The
 * loader owns every layout side effect once it runs: it appends the iframe, adds
 * 36 px to `<body>`'s padding-top, sets `scroll-padding-top: 36px` on `<html>`
 * (so anchor jumps clear the bar) and shifts every `fixed`/`sticky` element that
 * sits at `top: 0` down by 36 px — re-running that sweep on `pushState` /
 * `popstate` / `hashchange` / `load`, which covers App Router navigations and
 * elements that mount after hydration. On iPhone Safari it instead inserts the
 * bar *in flow* as the first child of `<body>` and skips all of that: the bar
 * scrolls away with the page there, so nothing may be offset.
 *
 * Because that mode is picked at runtime from the user agent, we deliberately
 * add **no** offsets of our own:
 * - `<body>` must stay padding-free — the loader ADDS 36 px to the computed
 *   value, so our own padding would double it to 72 px.
 * - a hard-coded `top: 36px` on the sticky `<Header>` / `<LanguageBanner>` would
 *   leave a 36 px gap on iPhone Safari, and would also stop the loader's sweep
 *   from touching them (it skips anything whose computed `top` isn't `0px`).
 *
 * Verified in headless Chromium against the production DOM (light + dark, 1280
 * and 390 px, home + park page, iPhone Safari UA, and with the language banner
 * showing): the sticky header lands at exactly 36 px and stays there once stuck,
 * the language banner follows it, `<body>` gets 36 px once, and with the script
 * removed everything returns to 0 px.
 *
 * The startup ID is public by design — it ships in the page source of every site
 * that installs the bar.
 */
const STARTUPBAR_ID = '107dfc55-6ac5-4e03-a73d-90461a5bc4e2';

/**
 * Server component: renders the loader as a plain `<script async>` so it is part
 * of the server-rendered HTML — startupbar.co verifies the installation by
 * fetching park.fan and looking for the tag, which a client-injected
 * `next/script` would not satisfy. React 19 hoists async scripts into `<head>`
 * and dedupes them by `src`.
 *
 * No `data-theme` attribute: the loader auto-detects ours from the `.dark` class
 * next-themes puts on `<html>` and follows theme switches via a MutationObserver
 * on it (confirmed — the bar renders light on `light`, `#18181b` on `dark`).
 */
export function StartupBar() {
  if (!STARTUPBAR_ENABLED) return null;

  return (
    <script async src="https://startupbar.co/widget/loader.js" data-startup-id={STARTUPBAR_ID} />
  );
}
