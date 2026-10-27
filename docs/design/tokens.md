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

| Name          | Hex       | oklch                        | Token                                 |
| ------------- | --------- | ---------------------------- | ------------------------------------- |
| **Blue**      | `#2191D3` | `oklch(0.628 0.137 241.275)` | `--primary`, `--ring` in both themes  |
| **Off-white** | `#FCFCFC` | `oklch(0.991 0 0)`           | `--primary-foreground`                |
| **Green**     | `#51CC64` | `oklch(0.752 0.181 146.391)` | the blog cover fallback (`--cover-c`) |
| **Navy**      | `#293B47` | `oklch(0.342 0.031 238.086)` | unused                                |

The rest of the base set (`--background`, `--foreground`, `--card`, `--popover`, `--muted`,
`--accent`, `--border`, `--destructive`, `--chart-*`, `--sidebar-*`) is shadcn's neutral palette:
white / `oklch(0.145 0 0)` in light, `oklch(0.145 0 0)` / `oklch(0.205 0 0)` cards in dark.
`--muted-foreground` is `oklch(0.556 0 0)` light (4.73 : 1 on white, just over AA) and
`oklch(0.708 0 0)` dark.

## Status

`--status-operating`, `--status-down`, `--status-closed`, `--status-refurbishment`, as
`*-status-*` utilities.

| Token                    | Light                                              | Dark                         |
| ------------------------ | -------------------------------------------------- | ---------------------------- |
| `--status-operating`     | `oklch(0.53 0.21 142.136)`                         | `oklch(0.792 0.209 151.711)` |
| `--status-down`          | `oklch(0.705 0.213 47.604)`                        | `oklch(0.78 0.188 56.113)`   |
| `--status-closed`        | `oklch(0.577 0.245 27.325)` red, = `--destructive` | `oklch(0.704 0.191 22.216)`  |
| `--status-refurbishment` | `oklch(0.623 0.214 259.815)`                       | `oklch(0.707 0.165 254.624)` |

**`--status-operating` is at lightness 0.53 for contrast, not looks.** It is small text often
("N offen", live wait labels); at 0.55 it was 4.39 : 1 on white and missed AA, at 0.53 it is
4.74 : 1 and the same green. Do not lighten it without re-measuring.

## Crowd levels

Six tiers, a green band (teal → emerald → green) then orange → rose → red, in two sets:

| Tier        | `--crowd-*` fill, light / dark                 | `--crowd-ink-*` text, light |
| ----------- | ---------------------------------------------- | --------------------------- |
| `very_low`  | `oklch(0.58 0.13 192)` / `oklch(0.8 0.14 192)` | `oklch(0.47 0.13 192)`      |
| `low`       | `oklch(0.6 0.18 162)` / `oklch(0.84 0.18 162)` | `oklch(0.46 0.18 162)`      |
| `moderate`  | `oklch(0.58 0.2 145)` / `oklch(0.84 0.2 145)`  | `oklch(0.47 0.2 145)`       |
| `high`      | `oklch(0.62 0.2 78)` / `oklch(0.86 0.18 78)`   | `oklch(0.5 0.2 78)`         |
| `very_high` | `oklch(0.58 0.22 52)` / `oklch(0.8 0.2 52)`    | `oklch(0.52 0.22 52)`       |
| `extreme`   | `oklch(0.55 0.24 25)` / `oklch(0.74 0.22 25)`  | `oklch(0.5 0.24 25)`        |

The fills are too light for a number on white, so text uses the **ink** set, which clears 4.5 : 1
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
(40 px blur with saturate and brightness, so text behind it breaks up rather than ghosting).
`app/globals.css` still defines `.glass`, `.glass-light`, `.glass-strong`, `.glass-heavy`,
`.glass-card`, `.glass-card-light`, `.glass-card-strong` and `.glass-header`; only `.glass-light`
is used (`planner-day-grid.tsx`).

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
| `.touch-target`                      | `min-h/min-w 44px`; applied nowhere, use [`PHONE_HIT_AREA`](touch-targets.md#the-target-grows-the-box-does-not)                                 |
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
