# Ride ↔ Glossary link (REQUIREMENT)

A ride's curated `rideProfile` from the API (track figures **in ride order**, ride type, builder)
stores **glossary term ids**. The ride page links them into the glossary (`RideProfileSection`,
`components/parks/ride-profile-section.tsx`) and each term page lists the rides that feature it
(`GlossaryTermRides`, `components/glossary/glossary-term-rides.tsx`).

- **Element order is meaningful and repeats are intentional** (Voltron Nevera really does two
  corkscrews back to back). Never dedupe or sort the figures.
- **This app is the only place a term id is defined.** It publishes the ids that resolve to a page at
  `/api/glossary-term-ids` (`app/api/glossary-term-ids/route.ts`). The API checks a curated profile's
  ids against that list on write and audits every stored id daily (`ride-profile-term-audit`), but
  rows already stored are not rewritten: renaming or removing a term leaves every ride layout that
  used it one figure short until the curation is fixed. Run the audit
  (`GET /v1/admin/ride-profile-term-audit`) before renaming or removing a term.

Background: [glossary → ride ↔ glossary link](../features/glossary.md#ride--glossary-link).
