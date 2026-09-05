'use client';

import { CalendarPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { plannerPath } from '@/lib/planner/segments';
import { plannerUi } from '@/lib/planner/ui-store';
import { cn } from '@/lib/utils';
import type { Locale } from '@/i18n/config';

/**
 * "Plan a day at this park", in the park's own header.
 *
 * The planner had exactly three inbound links and all three were site chrome:
 * the header nav, the burger and the footer. Nothing linked to it from the pages
 * that carry the intent — a visitor reading Phantasialand's wait times is the
 * person the feature is for, and the page said nothing about it. This is that
 * link, and it lands on the park page and the wait-time calendar together
 * because both are `ParkTitleHeader`.
 *
 * **The anchor names the park.** "Tag im Phantasialand planen" rather than "zum
 * Tagesplaner": anchor text is the strongest thing one page can say about
 * another, and 212 park pages saying "trip planner" would be 212 pages saying
 * the same four words. It also reads better, which is usually how you can tell.
 *
 * **It is an anchor that does not navigate, and that is a change of mind.** The
 * click asks for the panel and for the wizard's date step on the park already on
 * screen — `plannerUi.requestOpen('page-park-wizard')` — which is the same
 * gesture the calendar's "plan this day" makes. The note that used to stand here
 * said a link cancelling its own navigation would lie to the reader, and that
 * was true of what the alternative was then: a planner page that opens by asking
 * which park, a question this page has already answered. It is not true of a
 * panel that opens on the NEXT question with the park page still underneath.
 *
 * **The panel's half of that wire is the store's wizard counter.**
 * `PlannerFlyout` holds `startPagePark` — "wizard, on the park the route is
 * about" — and subscribes to `plannerUi.getWizardSnapshot`, which only the
 * intent named here moves. That intent is the whole of what this side owes it,
 * which is why the request carries no park of its own: `plannerPagePark`
 * already publishes which park the route behind the panel is about, and a park
 * passed through here would be a second copy of that answer, free to disagree
 * with the beacon's the moment the reader walks to another park.
 *
 * So the `href` stays, and it is the honest one rather than a `#`. A middle
 * click and a cmd/ctrl-click still open the planner's own page in a tab of the
 * reader's choosing, and a crawler still follows it — this is the planner's only
 * inbound link that carries an intent, and turning it into a `<button>` would
 * have thrown that away to save one `preventDefault`. Only a plain primary click
 * is taken over.
 *
 * A Client Component, and the smallest one this can be: the label arrives as a
 * finished string from `ParkTitleHeader`, which resolves it on the server. It
 * could read `useTranslations('parks')` here instead — the namespace is routed
 * to both these pages already, so it would cost no bytes — but it would add a
 * 24th call site to a 15.1 KB namespace this codebase is trying to narrow, for
 * one key.
 */
export function ParkPlannerLink({
  label,
  locale,
  className,
}: {
  /** The finished sentence, resolved on the server — see the note above. */
  label: string;
  locale: Locale | string;
  /** Merged with the button's own look rather than replacing it: the one caller
   * decides where the button sits in its row, never what it is. */
  className?: string;
}) {
  return (
    <Link
      href={plannerPath(locale) as '/trip-planner'}
      // The href is for the click this one does NOT take over, so it is not
      // worth an RSC prefetch on every park and calendar page — the link sits
      // in the header, i.e. in the viewport on load, and the default would
      // fetch the planner route 212 parks x 6 locales over for a navigation
      // that now only happens on a modified click.
      prefetch={false}
      data-park-planner-link=""
      onClick={(event) => {
        // Everything that is not a plain primary click is left alone. A
        // modified click is the reader asking for the planner's own page in a
        // window of their own, and taking that away is the thing the old note
        // warned about; the middle button fires `auxclick` and never arrives
        // here at all.
        if (event.defaultPrevented) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;
        event.preventDefault();
        plannerUi.requestOpen('page-park-wizard');
      }}
      className={cn(
        'bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors max-sm:min-h-11',
        className
      )}
    >
      <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}
