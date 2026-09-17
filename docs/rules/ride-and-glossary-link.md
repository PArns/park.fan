# Ride ↔ Glossary link

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

rides carry a curated `rideProfile` from the API (track figures **in ride order**, ride type, builder) stored as **glossary term ids**, so the ride page links into the glossary (`RideProfileSection`) and each term page lists the rides that feature it (`GlossaryTermRides`). Element order is meaningful and repeats are intentional — never dedupe or sort it. **This app is the only place a term id is defined** — the API's mirrored allowlist is gone, so nothing validates them and a renamed term silently shortens every ride layout that used it; check the API's `attraction_ride_profiles` rows before renaming or removing one. See [glossary](docs/features/glossary.md#ride--glossary-link).
