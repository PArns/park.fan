# Design System

## Overview

The park.fan frontend uses TailwindCSS 4 with custom CSS variables, shadcn/ui components, and a glassmorphism-style theme.

## Theme (next-themes)

- **Light / Dark** mode with system preference detection
- CSS variables in `app/globals.css` for both modes

## CSS Variables

### Base Colors

- `--background`, `--foreground` – Page background and text
- `--card`, `--card-foreground` – Card backgrounds
- `--primary`, `--primary-foreground` – Primary brand
- `--secondary`, `--muted`, `--accent` – Accents
- `--destructive`, `--border`, `--input`, `--ring`

### Park Colors

- `--park-primary`, `--park-secondary`, `--park-accent`

### Semantic Colors

- `--success`, `--error`, `--warning`
- `--trend-up`, `--trend-down`, `--trend-stable`

### Crowd Levels

- `--crowd-very-low` through `--crowd-extreme`

### Status Colors

- `--status-operating`, `--status-down`, `--status-closed`, `--status-refurbishment`

## Utility Classes

### Glassmorphism

- `.glass-light` – 40% opacity
- `.glass` – 60% opacity
- `.glass-strong` – 80% opacity
- `.glass-heavy` – 90% opacity
- `.glass-card-light`, `.glass-card`, `.glass-card-strong`

### Interactive

- `.interactive-card` – Hover effects for cards
- `.interactive-link` – Group hover wrapper
- `.group-interactive-text`, `.group-interactive-icon`

## Badge Styles

### Status Badges (Outline)

- **Open:** Green outline (`border-green-600 text-green-600`)
- **Closed:** Red outline (`border-red-500 text-red-500`)

### Crowd Level Badges (Filled)

- `very_low` → `bg-emerald-500`
- `low` → `bg-emerald-400`
- `moderate` → `bg-emerald-500` – displayed as **"Normal"**
- `high` → `bg-orange-500`
- `very_high` → `bg-rose-500`
- `extreme` → `bg-red-700`

## Component Patterns

### ParkCard Layout

1. Header: Park name + ChevronRight
2. Subtitle: City, Country
3. Status row: Distance/City (left) + Status badge (right)
4. Stats: Wait time + Crowd level badge
5. Attractions: Operating count + label
6. Background: Optional park image with gradient overlay

### Spacing

- Cards: `p-3 md:p-4`
- Content: `space-y-2 md:space-y-3`
- Gaps: `gap-4` for grids, `gap-2` for inline

## Related

- [TailwindCSS v4](https://tailwindcss.com/) – Custom `@variant group` for group-hover
- [shadcn/ui](https://ui.shadcn.com/) – Base components
