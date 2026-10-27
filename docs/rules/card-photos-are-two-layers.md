# Card photos are two layers (REQUIREMENT)

The framing reference for a card photo is the **strip between the glass panels**, never the whole
card. `CardPhotoFrame` (`components/parks/card-photo.tsx`) lives inside the card's photo-spacer row
(405 × 220, aspect 1.84), which is what a visitor sees, and mirrors that crop directly above and below
the strip, so the frosted panels blur a continuation of exactly what is seen. Same URL, so one
request and one decode. Where a card has no bottom panel (a ride with no live wait), the spacer takes
`row-span-2`, or the framed layer's lower edge sits exposed mid-card as a crop seam. Never widen the
frame layer back to the full card.

## Why

`object-fit: cover` scales to the larger of the two ratios it needs, so it overflows on one axis and
fits exactly on the other. Painted across a whole card (405 × 404, aspect ≈ 1.0), a 4:3 photo fills
its height exactly and leaves `object-position`'s Y nothing to move: the focal point renders
identical pixels however far it is dragged, with a green build. A card-sized copy behind the panels
has another scale and crop and shows as a band of a different picture at both panel edges.

## Check

`pnpm check:card-framing` (needs a running site) asserts the strip stays wider than 1.5. Background:
[media database → card framing](../features/media-database.md#card-framing).
