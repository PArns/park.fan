# No Creative Commons photos (REQUIREMENT)

**No photo under a Creative Commons licence goes into `public/media`, onto a card, into a post or
anywhere else on park.fan.** That covers CC BY, BY-SA, BY-NC and BY-ND in every version, and CC0 for
anything added from now on. Wikimedia Commons is therefore not a source: nearly everything there
carries one of these licences.

A photo comes from one of these sources, and its sidecar says which:

| Source                                    | `credit.license`      | `credit.source`          |
| ----------------------------------------- | --------------------- | ------------------------ |
| Our own shoot                             | `all-rights-reserved` | `own`                    |
| A reader's upload through `/contribute`   | `all-rights-reserved` | `contribution`           |
| A park's press kit, with written approval | `all-rights-reserved` | `press-kit`              |
| Unsplash                                  | `unsplash`            | `unsplash` + `sourceUrl` |

If none of these has the motif, the post or card runs without a photo: the cards fall back to their
gradient, and a post without `coverImage` gets the brand cover (`BlogCoverFallback`). A photo that is
not our own still carries its credit on the picture ([media database](media-database.md)).

Four older CC0 or public-domain photos from Wikimedia Commons (Alton Towers' Galactica and The
Towers, Legoland's Flying Ninjago, Plopsaland's Expedition GeForce) need no attribution and may stay
until an own photo replaces them.

## Why

On 2026-10-12 eleven photos under CC BY 4.0 and CC BY-SA 4.0 were on the site: ride-card photos,
Plopsaland's park background, blog covers and inline images. The licences allow that only with the
author, a link to the licence, a link to the source and a note on any change, on or next to the
picture; the cards showed none of it. In Germany that is routinely answered with a paid warning
letter (Abmahnung) and a damages claim. They were removed in
[PArns/park.fan#908](https://github.com/PArns/park.fan/pull/908). Getting attribution right on every
surface that will ever paint a photo costs more than the photos are worth.

## Check

`pnpm generate:media` (and so every build) fails when a sidecar's `credit.license` starts with
`cc-by`. The licence enum in `lib/media/types.ts` still lists those values so old sidecars parse; the
generator is where they stop. CC0 is not caught by the build, because of the four photos above.
