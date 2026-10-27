# Ride ↔ Glossary link (REQUIREMENT)

A ride's curated `rideProfile` from the API (track figures **in ride order**, ride type, builder)
stores **glossary term ids**. The ride page links them into the glossary (`RideProfileSection`,
`components/parks/ride-profile-section.tsx`) and each term page lists the rides that feature it
(`GlossaryTermRides`, `components/glossary/glossary-term-rides.tsx`).

- **Element order is meaningful and repeats are intentional** (Voltron Nevera really does two
  corkscrews back to back). Never dedupe or sort the figures.
- **This app is the only place a term id is defined.** It publishes the ids that resolve to a page at
  `/api/glossary-term-ids` (`app/api/glossary-term-ids/route.ts`); the API checks writes against it
  and audits stored ids daily, but never rewrites a stored row
  ([curation → ride profiles](https://github.com/PArns/v4.api.park.fan/blob/main/docs/admin/curation.md#ride-profiles)).
  So renaming or removing a term leaves every ride layout that used it one figure short: run
  `GET /v1/admin/ride-profile-term-audit` before you do either.

Background: [glossary → ride ↔ glossary link](../features/glossary.md#ride--glossary-link).
