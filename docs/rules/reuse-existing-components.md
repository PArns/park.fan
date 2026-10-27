# Reuse existing components (REQUIREMENT)

Before writing a badge, a card or a status indicator, use the component that already draws it:
`ParkStatusBadge` (`components/parks/park-status-badge.tsx`), `CrowdLevelBadge`
(`components/parks/crowd-level-badge.tsx`), `Badge` (`components/ui/badge.tsx`), `ParkCard`
(`components/parks/park-card.tsx`) and the rest listed in the [code index](../code-index/README.md).
Build a new one only when nothing suitable exists, and extend an existing one rather than
re-implementing its markup inline.

## Why

A second rendering of the same thing drifts in colour, spacing and behaviour at its first edit, and
nothing compares the two. This is the UI half of
[one place for each piece of logic](dry-one-place-for-each-piece-of-logic.md).
