# Tokens, utilities and theme

The colour tokens in `app/globals.css`, the class strings that apply them (badges, crowd faces,
glass), the custom utility classes, and how the dark-by-default theme switches. Open it before
choosing a colour, a glass surface or a badge style.

## How a token becomes a class

Tokens are oklch custom properties on `:root` (light) and `.dark`. Registered in `@theme inline` as
`--color-<name>`, Tailwind generates the whole family with `/opacity` (`bg-status-down/15`,
`border-primary/40`). A hand-written utility class has no `/opacity`: `bg-park-primary/5` on one
compiles to nothing, without a warning, which is why every colour a call site tints is a theme
colour. Never repeat a token's value at a call site; never add a second `crowd → colour` map
(below).

## Brand

| Name          | Hex       | Token                                 |
| ------------- | --------- | ------------------------------------- |
| **Blue**      | `#2191D3` | `--primary`, `--ring` in both themes  |
| **Off-white** | `#FCFCFC` | `--primary-foreground`                |
| **Green**     | `#51CC64` | the blog cover fallback (`--cover-c`) |
| **Navy**      | `#293B47` | unused                                |

`--primary-ink` is the blue as small text: `--primary` is 3.1 : 1 on the light hero glass and
misses AA for a 10 px kicker, so text in the brand colour on glass takes `text-primary-ink`
(lightness 0.47 in light, 6.0 : 1 there; 0.74 in dark). The hero search's kickers, „Alle anzeigen"
and its focus ring use it.

Every value is in `app/globals.css`, as oklch, and only there. The rest of the base set
(`--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--accent`, `--border`,
`--destructive`, `--chart-*`, `--sidebar-*`) is shadcn's neutral palette. `--muted-foreground` in
light is 4.73 : 1 on white, just over AA.

## Status

`--status-operating` (green), `--status-down` (orange), `--status-closed` (red, the same as
`--destructive`) and `--status-refurbishment` (blue), light and dark in `app/globals.css`, as
`*-status-*` utilities.

**`--status-operating` is at lightness 0.53 for contrast, not looks.** It is small text often
("N offen", live wait labels); at 0.55 it was 4.39 : 1 on white and missed AA, at 0.53 it is
4.74 : 1 and the same green. Do not lighten it without re-measuring.

## Crowd levels

Six tiers, `very_low` to `extreme`: a green band (teal → emerald → green) then amber → orange → red,
in two sets of tokens in `app/globals.css`, the `--crowd-<tier>` fills (light and dark) and the
`--crowd-ink-<tier>` text colours (tier names in kebab case there). The fills are too light for a number on white, so text uses the **ink** set, which clears 4.5 : 1
on a ground as dark as a light photo under glass; in dark mode ink equals the fill. Every face of a
tier comes from `lib/utils/crowd-level-styles.ts`, as full literal strings so Tailwind's scanner
sees them:

| Constant              | Face                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `CROWD_TEXT_CLASS`    | ink text (inline values, blog annotations)                                                      |
| `CROWD_BADGE_CLASS`   | the solid `badge-crowd-*` badge (`CrowdLevelBadge`)                                             |
| `CROWD_SOLID_CLASS`   | an opaque fill with white text in both themes (the compass)                                     |
| `CROWD_OUTLINE_CLASS` | tinted border and ink text (live ticker)                                                        |
| `CROWD_TILE_CLASS`    | the calendar day tile; opacity climbs with the tier, so tiers differ in weight, not only in hue |
| `CROWD_SCALE_CLASS`   | a legend segment with near-black text in both themes                                            |
| `CROWD_DOT_CLASS`     | a solid dot                                                                                     |
| `CROWD_CHIP_CLASS`    | a soft chip (best-days chips)                                                                   |

`CROWD_LEVEL_ORDER`, `CROWD_LEVEL_PERCENT_RANGE` (the API's thresholds) and `waitTimeCrowdTier()`
(minutes → tier, one colour for a wait everywhere) live in the same file; score → level is
`scoreToCrowdLevel` in `lib/utils/crowd-analysis.ts`. `unknown` is not a tier and has no colour.

### Neighbouring tiers tell apart, at no cost in contrast

`moderate` is at hue 130 (yellow-green), not at the 145 of the emerald band next to it: at 145,
Niedrig and Normal were 0.060 apart in OKLab and read as one colour on a calendar tile. Every
neighbouring pair is now at least 0.094 apart, and no text face of any tier lost contrast. Measured
2026-11-14 with the tokens' own grounds (white and `oklch(0.145 0 0)`, the dark card
`oklch(0.205 0 0)` under a 60 % badge); the value before the move in brackets:

| OKLab distance      | very_low–low | low–moderate  | moderate–high | high–very_high | very_high–extreme |
| ------------------- | ------------ | ------------- | ------------- | -------------- | ----------------- |
| fills, light        | 0.096        | 0.107 (0.063) | 0.178 (0.224) | 0.104          | 0.113             |
| ink, light          | 0.094        | 0.107 (0.060) | 0.178 (0.223) | 0.099          | 0.111             |
| fills and ink, dark | 0.100        | 0.107 (0.060) | 0.168 (0.211) | 0.106          | 0.117             |
| badges              | 0.115        | 0.108 (0.058) | 0.176 (0.222) | 0.104          | 0.113             |

| Contrast of `moderate` | ink on page   | ink on tile   | legend chip   | badge       | soft chip   |
| ---------------------- | ------------- | ------------- | ------------- | ----------- | ----------- |
| light                  | 6.34 (6.00)   | 5.79 (5.47)   | 5.15 (5.08)   | 6.08 (5.76) | 5.03 (4.74) |
| dark                   | 13.16 (12.95) | 11.96 (11.79) | 13.16 (12.95) | 9.82 (9.61) | 9.40 (9.29) |

The other five tiers did not change. `CROWD_SOLID_CLASS` reads the `--badge-crowd-*` tokens
rather than a copy of their values, and the dark theme no longer repeats them.

## Badges

A badge is `Badge` (`components/ui/badge.tsx`) plus **one** class from `@layer utilities` that
bundles the fill, a `/25` border, white uppercase bold text and a shadow:
`.badge-status-{operating,down,closed,refurbishment,unknown}`,
`.badge-crowd-{very-low,…,extreme}`, `.badge-primary`, `.badge-trend-{up,down,stable}`. The fills are
dark `--badge-*` tones applied at `--badge-fill`: 100 % in light (white text at 5.4 : 1 or better
over anything) and 60 % in dark (9.9 : 1 or better over a near-black panel). `ParkStatusBadge` and
`CrowdLevelBadge` (`components/parks/`) map a status or level to them; reuse those rather than a
class at a call site.

## Other tokens

- `--success`, `--error`, `--warning` (with `-foreground`) and `--trend-up` (red, rising waits),
  `--trend-down` (green), `--trend-stable` (muted), all theme colours with `/opacity`;
  `.text-trend-*` also exist as plain classes.
- `--element-launch`, `-airtime`, `-inversion`, `-turn`, `-brake`: the ride profile rail, hues
  deliberately apart from the crowd band because both appear on one page.
- `--park-primary` / `--park-primary-foreground`.
- `--pk-*`: the park card's glass panels, scrims, favourite button and three text tones, per theme.

## Glass

Glass in components is the constants in `components/common/glass-card.tsx`, not utility classes:
`GlassCard` with `variant` `light` / `medium` (default) / `strong` / `heavy` / `tile`, and the
strings `TILE_GLASS` (the header cards and frosted chapter bands), `HEAVY_GLASS`,
`PHOTO_GLASS_FILL`, `HAIRLINE_FILL`, `PANEL_FLAT`. The header's menu band is `.pk-menu-glass`
(40 px blur with saturate and brightness, so text behind it breaks up rather than ghosting), and
so is the language banner that hangs under the header (`components/layout/language-banner.tsx`).
Two glass utility classes are left in `app/globals.css`: `.glass-light` (`planner-day-grid.tsx`)
and `.glass-card` (the pill breadcrumb in `breadcrumb-nav.tsx`).

Two constraints hold for every glass surface: a transform or `backdrop-filter` on an ancestor makes
it a backdrop root and flattens the blur (see [cards](cards-and-heroes.md#pointer-depth) and the
[header](header.md#two-states-one-navigation)), and no endless animation runs inside one
([work nobody can see](../rules/work-nobody-can-see-is-still-work.md)).

## Utility classes

| Class                                | Does                                                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `.u-metric` / `.u-imperial`          | show one temperature unit under `html[data-temp-unit]` ([the rule](../rules/a-client-only-preference-may-not-decide-server-rendered-markup.md)) |
| `.pk-reveal`                         | a section rising in on scroll (below)                                                                                                           |
| `.pk-tile-reveal`                    | an entry-tile row's contents rising 6 px one after another (`--tile-i` from `EntryTileBody`)                                                    |
| `.pk-card-fx`                        | the pointer highlight on a card ([cards](cards-and-heroes.md#pointer-depth))                                                                    |
| `.pk-photo-zoom`, `.pk-photo-closed` | a card photo's hover zoom; greyscale for a closed park, lifted only on a real hover                                                             |
| `.pk-panel-seam-sm`                  | the top panel's lower edge on a card with no bottom panel                                                                                       |
| `.interactive-card`                  | `hover:border-primary/50 hover:scale-[1.02] hover:shadow-lg`                                                                                    |
| `.no-scrollbar`                      | hides a scroll container's bar                                                                                                                  |

### Section reveals

`.pk-reveal` is a scroll-driven CSS animation (`animation-timeline: view()`, entry 0–42 %), under
`prefers-reduced-motion: no-preference` and `@supports`. It replaced the `<Reveal>` component,
which rendered `opacity-0` until an IntersectionObserver fired, so with JavaScript blocked its
content stayed invisible; a browser without `view()` just shows the section. It fills `backwards`,
never `both`: a retained transform would make the section a backdrop root. For the same reason it
goes only on sections with **no glass**: on the homepage it wraps the announcement band, and
the live-activity section (`GlassCard`s) is left out on purpose. `.pk-tile-reveal` animates `[data-tile-stagger]` inside a tile, never the
tile, which carries `backdrop-blur`.

## Theme: dark by default

`ThemeProvider` runs `defaultTheme="dark"` and `enableSystem={false}` (`app/[locale]/layout.tsx`):
every visitor gets dark and opts into light. Following the OS would make the site dark for some
and light for others by accident, so the three-way light/dark/system menu is gone. A browser still
holding `system` is moved to dark by `ThemeToggle`, stray class included (next-themes writes
`system` onto `<html>` as if it were a theme). `viewport.themeColor` is one value (`#0a0a0a`) for
the same reason.

The switch splits motion like the rest of the code: **CSS owns the state** (the knob's position is
a class, so a failed GSAP chunk still switches), **GSAP owns the flourish**
(`lib/theme/theme-wipe.ts`): the icon spins, and the incoming theme opens out of the switch as a
disc that covers the viewport before the colours flip, then lifts off. While it covers, the lockup
sits centred on the **viewport** (not the disc), sized with `clamp()`, in the incoming theme's
artwork, which the header has already loaded. Measured: overlay up at 4 ms, flip at 569 ms, gone at
1160 ms. The disc is a scaled element, not an animated `clip-path` (a transform composites on the
GPU and interpolates as a number). Under `prefers-reduced-motion`, or if the import fails, the
theme still changes: `apply` runs exactly once on every path.
