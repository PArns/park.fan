# An admin list without an action is unfinished (REQUIREMENT)

Every card on an admin screen that reports a problem **states the question it asks and answers it
with a button on the card itself**. A link to the ride, the park or another page is context, not an
answer. Done means: the operator reads the card, decides, clicks, and the card is gone.

- **Name the decision** in one line above the evidence („Saisonende oder abgerissener Feed?"), not
  only in the section intro.
- **One button per possible answer.** Where an answer needs input (months, a reason), the button
  opens it inline on the card: no dialog, no navigation away.
- **Write through the audited endpoints** (`PATCH /api/admin/content/...` for curation,
  `merge-duplicate-attractions` for merges, `review-marks` for "not a case"), so the answer has an
  audit row, evicts caches and stays answered.
- **The card disappears after the answer.** Read the list through `useAdminQuery`
  (`app/admin/_lib/api.ts`) and invalidate its key; `useAdminFetch` cannot refetch. The backend query
  has to exclude what was answered, or the button "works" and the card stays.
- **Bulk where the population is bulk.** 22 Wet'n'Wild facilities are one decision, so the park card
  has „Alle: ist weg".
- **When the honest answer is "nothing to do here"**, the button says so and explains when the card
  leaves by itself (the silenced cluster's „Feed-Problem").
- **A button names what exists.** „Stack in Queues ansehen", not „neu starten", when the queue page
  cannot retry.

Implementations to copy: `app/admin/data-quality/season-actions.tsx`,
`app/admin/duplicates/reissue-candidates.tsx`.

## Why

`/admin/data-quality` launched with three detectors whose cards asked "season ending or dropped
feed?" and "season or gone?" and offered only a list of ride links. The PO's verdict on 2026-10-04:
_„Hier gibt es keine CTAs, keine Ahnung, was ich mit der Liste machen soll."_ A detector without a
screen is invisible; a screen without an action is a list of chores with no tool, and both end with
the same rows still wrong a month later.
