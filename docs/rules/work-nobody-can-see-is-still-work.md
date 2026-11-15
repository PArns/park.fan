# Work nobody can see is still work (REQUIREMENT)

**CSS hiding an element does not stop its JavaScript.** A component under `hidden lg:block`, below
the fold, in a background tab or in a closed panel still runs its effects, listeners, observers and
timers unless it asks whether anybody can see it. Gate the work on the same question the markup
answers:

| Hidden by                        | Ask                                                               | Example                                    |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| a breakpoint (`hidden lg:block`) | `useMediaQuery('(min-width: 64rem)')` (rem, like Tailwind's `lg`) | blog ToC scroll spy, guide page wait scale |
| being far down the page          | an `IntersectionObserver` with a generous `rootMargin`            | `BlogMapClient`, `LazyMount`               |
| a background tab                 | `document.hidden` / the shared clock, which pauses on its own     | `useMinuteNow`, hero rotation              |
| a closed dialog                  | mount it on the first press                                       | `RideAlertBell`, `ShowFollowBell`          |
| an effect meant for a change     | skip the first run                                                | `ScrollToTop`                              |

- **No endless animation inside a `backdrop-filter` box.** The blur is re-read whenever its region
  is dirtied, and `will-change` did not stop the "Heute im Park" header from flickering. A live
  indicator in a glass card is a static dot: `<LiveDot showPing={false} … />`. The one exception
  is the owner's: the region scenes (`loop` in `TripRegionSceneProps`,
  [Parky on holiday](../features/parky-character.md#pictures-of-him)) loop in the header's planner
  band while it is open, in the trip planner's assistant while its dialog is open, and on a page
  (the homepage's region tiles, a park's planner tile) while any of the tile shows below the
  header. They run only while they are seen: the band is `display: none` when closed, which
  cancels every CSS animation in it, the dialog's content is unmounted when it closes, and a tile
  on a page asks `useActiveOnScreen` with the header's 48 px taken off the top, so nothing loops
  under the header's glass alone or in a background tab. They move only `transform` and `opacity`
  inside opaque tiles, animate a set of lights as one element rather than each light, and stand
  still under reduced motion.
- **Every endless animation stops for `prefers-reduced-motion`** (`LiveDot`:
  `motion-reduce:hidden`, `motion-reduce:animate-none`).
- **A layout read belongs in an observer callback or at the start of a hover**, not in a `scroll`,
  `resize` or `mousemove` handler. Where a handler has to measure, it measures once per frame
  (`requestAnimationFrame`) and commits only when a number changed. The sparkline measures its box
  on `mouseenter`.
- **A flourish loads no library after load.** A decorative motion that needs a library is loaded by
  the interaction that shows it, never by the page load.

## Why

The 2026-09-28 audit found the blog ToC running a scroll listener and a ResizeObserver on `<body>` on
phones where it is `display: none`; the guide page fetching GSAP to tween a hidden figure; the blog
map mounting Leaflet, requesting tiles and starting a clock on hydration for a fence near the end of
a post; the compass slot reading `getBoundingClientRect()` on every scroll event; and the header's
logo handoff re-rendering the whole header on every `resize`, which a phone fires each time its
address bar collapses. The park page's tile row slid its labels up 6 px with GSAP imported on mount:
a 70 KB chunk evaluated just as visitors started to tap, 703 ms in a trace at 4× CPU. The row now
rises in CSS from its first paint (`.pk-tile-reveal`, `app/globals.css`), and a phone loading a
park or ride page no longer requests the chunk.

The planner band's scenes loop since 2.22.1, at the owner's request („so lange das Menü sichtbar
ist"), and the tiles on the homepage and in the trip planner since the owner asked for them to move
„wie im Supermenü“. Measured on 2026-11-14 in headless Chromium against `next dev`: with the band closed none of
the scenes' animations exist; with it open Chromium composites all of them but the trail's one-off
draw, and the glass beside the tiles stayed the same in 30 screenshots in a row. One animation per
light on the Eiffel Tower cost the main thread about 145 ms per second, eight sets of five lights
about 16 ms, so the glitter and the lanterns move in sets.
