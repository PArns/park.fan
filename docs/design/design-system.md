# Design system

The index of the design docs: the stack, and one page per subject. Open the page for what you are
changing; the standing rules for layout and components are under
[design and layout](../rules/README.md#design-and-layout).

The frontend uses Tailwind CSS 4 with oklch custom properties in `app/globals.css`, shadcn/ui
primitives in `components/ui/`, and frosted glass over photographs as its main material. The site
is dark by default. Existing components, hooks and class constants are listed in the
[code index](../code-index/README.md); reuse them
([the rule](../rules/reuse-existing-components.md)).

| Page                                     | Covers                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Tokens, utilities and theme](tokens.md) | colour tokens, status and crowd colours and their class faces, badges, glass constants, utility classes, section reveals, the dark-by-default theme and its switch |
| [Header bar](header.md)                  | the 48 px height and where it is written, what sits in the bar, its width budget, the phone sheet's preferences, the two states over a hero, the lockup            |
| [Chapter headings](chapter-headings.md)  | `ChapterHeading` on every surface, its variants, numbering, streamed headings, phone sizes                                                                         |
| [Cards and heroes](cards-and-heroes.md)  | pointer depth on cards, park and blog cards as rows on phones, full-bleed heroes on phones, landing-page heads                                                     |
| [Ride page](ride-page.md)                | the ride page's header card, chapter row, rope-drop stand-in panel, typical-waits colour rank, history calendar                                                    |
| [Touch targets](touch-targets.md)        | the button scale's 44 px phone tier, `PHONE_HIT_AREA`, overlapping targets                                                                                         |

Tooling for design review: [impeccable](../development/impeccable.md).
