# Work nobody can see is still work (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning, the measurements and the counter-examples.

**CSS hiding an element does not stop its JavaScript.** A component under `hidden lg:block`, below
the fold, in a background tab or in a closed panel still runs its effects, listeners, observers
and timers unless it asks whether anybody can see it. Gate the work on the same question the markup
answers:

| Hidden by                        | Ask                                                               | Example                                          |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------ |
| a breakpoint (`hidden lg:block`) | `useMediaQuery('(min-width: 64rem)')` — rem, like Tailwind's `lg` | blog ToC scroll spy, guide page wait scale       |
| being far down the page          | an `IntersectionObserver` with a generous `rootMargin`            | `BlogMapClient`, `LazyMount`, `ParkCompassSlot`  |
| a background tab                 | `document.hidden` / the shared clock, which pauses on its own     | `useMinuteNow`, hero rotation                    |
| a closed dialog                  | mount it on the first press                                       | `RideAlertBell`, `ShowFollowBell`                |
| an effect meant for a change     | skip the first run                                                | world map chip tween (`hero-world-panel-client`) |

Found in the 2026-09-28 audit: the blog ToC ran a scroll listener and a ResizeObserver on `<body>`
on phones where it is `display: none`; the guide page fetched GSAP and tweened a hidden figure; the
blog map mounted Leaflet, requested tiles and started a clock on hydration for a fence near the end
of a post; the world map fetched GSAP on mount to fade in chips that were already painted; the
compass slot read `getBoundingClientRect()` on every scroll event.

## Endless animations

- **No endless animation inside a `backdrop-filter` box.** The blur is re-read whenever its region
  is dirtied, and `will-change` did not stop the "Heute im Park" header from flickering
  (`park-today-panel.tsx` documents the measurement). A live indicator in a glass card is a static
  dot: `<LiveDot showPing={false} … />`. The ride chart's best-slot rings and the ML card's dot were
  changed for this.
- **Every endless animation stops for `prefers-reduced-motion`.** `LiveDot` hides its ping ring and
  stops its pulse (`motion-reduce:hidden`, `motion-reduce:animate-none`).

## Layout reads

A layout read (`getBoundingClientRect`, `offsetLeft`, `scrollHeight`) belongs in an observer callback
or at the start of a hover, not in a `scroll`/`resize`/`mousemove` handler. Where a handler has to
measure, it measures once per frame (`requestAnimationFrame`) and commits only when a number
changed: the header's logo handoff re-rendered the whole header on every `resize`, and a phone
fires one each time the address bar collapses. The sparkline measures its box on `mouseenter`.
