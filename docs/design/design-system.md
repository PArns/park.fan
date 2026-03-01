# Design System

## Overview

The park.fan frontend uses Tailwind CSS v4 with CSS custom properties (oklch), shadcn/ui components, and a glassmorphism-style theme. All color tokens are defined in `app/globals.css`.

---

## Brand Palette

| Name          | Hex       | oklch                        | Usage                                          |
| ------------- | --------- | ---------------------------- | ---------------------------------------------- |
| **Blue**      | `#2191D3` | `oklch(0.628 0.137 241.275)` | `--primary`, `--ring`, buttons, focus, borders |
| **Navy**      | `#293B47` | `oklch(0.342 0.031 238.086)` | Reserved (dark bg candidate)                   |
| **Green**     | `#51CC64` | `oklch(0.752 0.181 146.391)` | Close to `--status-operating`                  |
| **Off-white** | `#FCFCFC` | `oklch(0.991 0 0)`           | `--primary-foreground`, text on primary        |

### Applying brand blue in Tailwind

Because `--color-primary` is registered in `@theme inline`, all Tailwind color utilities are available with opacity modifier support:

```
bg-primary          bg-primary/15       bg-primary/30
text-primary        border-primary/40   ring-primary/20
shadow-primary/10
```

---

## CSS Variables (`app/globals.css`)

### Base Colors

| Variable               | Light mode                      | Dark mode                       |
| ---------------------- | ------------------------------- | ------------------------------- |
| `--background`         | `oklch(1 0 0)` (white)          | `oklch(0.145 0 0)` (near-black) |
| `--foreground`         | `oklch(0.145 0 0)`              | `oklch(0.985 0 0)`              |
| `--card`               | `oklch(1 0 0)`                  | `oklch(0.205 0 0)`              |
| `--primary`            | `oklch(0.628 0.137 241.275)` 🔵 | `oklch(0.628 0.137 241.275)` 🔵 |
| `--primary-foreground` | `oklch(0.991 0 0)`              | `oklch(0.991 0 0)`              |
| `--ring`               | `oklch(0.628 0.137 241.275)` 🔵 | `oklch(0.628 0.137 241.275)` 🔵 |
| `--muted-foreground`   | `oklch(0.556 0 0)`              | `oklch(0.708 0 0)`              |

### Status Colors

Registered in `@theme inline` as `--color-status-*` → Tailwind generates `bg-status-*`, `text-status-*`, `border-status-*` with `/opacity` support.

| Variable                 | Light                           | Dark                            |
| ------------------------ | ------------------------------- | ------------------------------- |
| `--status-operating`     | `oklch(0.723 0.219 142.136)` 🟢 | `oklch(0.792 0.209 151.711)` 🟢 |
| `--status-down`          | `oklch(0.705 0.213 47.604)` 🟠  | `oklch(0.78 0.188 56.113)` 🟠   |
| `--status-closed`        | `oklch(0.556 0 0)` ⚫           | `oklch(0.708 0 0)` ⚫           |
| `--status-refurbishment` | `oklch(0.623 0.214 259.815)` 🔵 | `oklch(0.707 0.165 254.624)` 🔵 |

### Crowd Level Colors

Registered in `@theme inline` as `--color-crowd-*` → same Tailwind utility generation as status.

| Variable            | Light                          | Dark (brighter)        |
| ------------------- | ------------------------------ | ---------------------- |
| `--crowd-very-low`  | `oklch(0.52 0.14 192)` teal    | `oklch(0.76 0.16 192)` |
| `--crowd-low`       | `oklch(0.65 0.19 158)` emerald | `oklch(0.84 0.16 158)` |
| `--crowd-moderate`  | `oklch(0.68 0.18 142)` green   | `oklch(0.84 0.15 142)` |
| `--crowd-high`      | `oklch(0.68 0.18 55)` orange   | `oklch(0.82 0.16 55)`  |
| `--crowd-very-high` | `oklch(0.58 0.22 15)` rose     | `oklch(0.78 0.18 15)`  |
| `--crowd-extreme`   | `oklch(0.52 0.22 27)` red      | `oklch(0.72 0.2 27)`   |

### Semantic Colors

Manual `@layer utilities` (not in `@theme inline`, no opacity modifier):

- `--success` / `--success-foreground`
- `--error` / `--error-foreground`
- `--warning` / `--warning-foreground`
- `--trend-up`, `--trend-down`, `--trend-stable`

---

## Badge Pattern

**All badges use the soft pattern** — semi-transparent background + colored text, works in light and dark mode without separate overrides:

```tsx
// Status badge
'bg-status-operating/15 text-status-operating';
'bg-status-down/15 text-status-down';
'bg-status-closed/15 text-status-closed';
'bg-status-refurbishment/15 text-status-refurbishment';

// Crowd badge
'bg-crowd-very-low/15 text-crowd-very-low';
'bg-crowd-low/15 text-crowd-low';
// ... etc.
```

Components: `CrowdLevelBadge` (`components/parks/crowd-level-badge.tsx`), `ParkStatusBadge` (`components/parks/park-status-badge.tsx`).

---

## Glassmorphism Utilities (`@layer utilities`)

| Class                | Background         | Border      | Blur               |
| -------------------- | ------------------ | ----------- | ------------------ |
| `.glass-light`       | `bg-background/40` | `border/30` | `backdrop-blur-sm` |
| `.glass`             | `bg-background/60` | `border/40` | `backdrop-blur-md` |
| `.glass-strong`      | `bg-background/80` | `border/50` | `backdrop-blur-lg` |
| `.glass-heavy`       | `bg-background/90` | `border/60` | `backdrop-blur-xl` |
| `.glass-card`        | `bg-card/60`       | `border/40` | `backdrop-blur-md` |
| `.glass-card-strong` | `bg-card/80`       | `border/50` | `backdrop-blur-lg` |

---

## Search Dialog

The `CommandDialog` in `components/ui/command.tsx` uses brand blue throughout:

- **Outer border**: `border-primary/30`
- **Shadow ring**: `0_0_0_1px_rgba(33,145,211,0.2)` + blue top highlight
- **Input area**: `border-b border-primary/20 bg-primary/[3%]`
- **Footer**: `border-t border-primary/20 bg-primary/[3%]`
- **Selected item**: `bg-primary/15`

---

## Interactive Utilities

- `.interactive-card` – `hover:border-primary/50 transition-all hover:shadow-lg`
- `.touch-target` – `min-h-[44px] min-w-[44px]`

---

## Related

- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Glass UI Crenspire](https://glass-ui.crenspire.com) — additional glass components in `components/ui/glass/`
