# Dashboard Redesign v1

## Overview

Redesigned the Magen dashboard to match the Stitch "Magen Dashboard (Top Nav)" design. The redesign applies a Material Design 3 color system, new typography, and a command-center aesthetic while preserving all existing functionality (data fetching, hooks, stores, localization, accessibility, RTL support, animations).

## Design System Changes

### Color System

Replaced the oklch-based slate/rose/sky palette with MD3 tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `--md3-surface` | `#131313` | Page background |
| `--md3-surface-container-lowest` | `#0e0e0e` | Ticker, stream panel |
| `--md3-surface-container-low` | `#1c1b1b` | Sidebar sections, filter bar, cards |
| `--md3-surface-container` | `#20201f` | Inner cards, inputs, watchlist items |
| `--md3-surface-container-high` | `#2a2a2a` | Alert hero, hover states |
| `--md3-surface-container-highest` | `#353535` | Glass panels, elevated elements |
| `--md3-primary` | `#89ceff` | Primary accent (links, active tabs, branding) |
| `--md3-primary-container` | `#0ea5e9` | Primary gradient endpoint |
| `--md3-secondary` | `#ffb95f` | Secondary accent (severity, amber indicators) |
| `--md3-error` | `#ffb4ab` | Alert/error states |
| `--md3-error-container` | `#93000a` | Critical alert badges |
| `--md3-on-surface` | `#e5e2e1` | Primary text |
| `--md3-on-surface-variant` | `#bec8d2` | Secondary text |
| `--md3-outline` | `#88929b` | Tertiary text, labels |
| `--md3-outline-variant` | `#3e4850` | Subtle borders (used at low opacity) |

All tokens are registered in the Tailwind v4 `@theme inline` block as `--color-md3-*`, enabling utility classes like `bg-md3-surface`, `text-md3-primary`, etc.

### Typography

| Role | Font | Usage |
|------|------|-------|
| Body/Headlines | **Inter** | All body text, headings, alert titles |
| Labels | **Space Grotesk** | Uppercase labels, tab buttons, metadata, badges |
| Monospace | System mono | Timestamps in feed items |
| Hebrew | Noto Sans Hebrew Variable | RTL body text (unchanged) |

Fonts loaded via `next/font/google` in `src/app/layout.tsx`. CSS variables: `--font-inter`, `--font-space-grotesk`.

### Visual Rules

- **No traditional borders** — structural separation via tonal surface shifts
- **Tight border radii** — `rounded-lg` (0.5rem) for cards, `rounded-xl` (0.75rem) for main sections
- **Custom scrollbar** — 4px wide, `outline-variant` thumb, `primary` on hover
- **Glass panel utility** — `.glass-panel` class with backdrop blur

## Layout Changes

### Before
```
[Header h-12 sticky]
[FilterBar]
[NewsTicker h-9]
[Grid: 200px | 1fr | 380px, gap-px]
  [Left: SourceHealth + Watchlist]
  [Center: AlertHero + OfficialGuidance]
  [Right: FeedPanel]
[StreamPanel col-span-full bottom row]
```

### After
```
[Header h-14 fixed, with nav tabs + duty officer]
[FilterBar with search icon + filter chips]
[NewsTicker with BREAKING/UPDATE badges]
[Grid: 240px | 1fr | 380px, gap-2 p-2]
  [Left: IntelSources + Watchlist + Deploy Button]
  [Center: AlertHero + OfficialGuidance + StreamPanel (scrollable)]
  [Right: FeedPanel with View Full History button]
```

Key structural changes:
- Header changed from sticky `h-12` to fixed `h-14` with `pt-14` spacer on body
- Left sidebar widened from 200px to 240px
- StreamPanel moved from bottom full-width row into center column
- Grid gap changed from `gap-px` to `gap-2` with `p-2` padding
- Center column scrolls independently (`overflow-y-auto min-h-0`)

## Component Changes

### CommandBar (`command-bar.tsx`)
- Added Shield icon + "Magen" branding in primary blue
- Added decorative nav tabs: Map (active), Intel, Assets, Logs
- Added status indicator with label ("Active"/"Degraded"/etc.)
- Language toggle changed from `<select>` to pill-style buttons
- Added decorative action icons: Radar, Bell (with notification dot), Settings
- Added Duty Officer section with avatar placeholder

### FilterBar (`filter-bar.tsx`)
- Added Search icon inside input
- Added ChevronDown icon on dropdown
- Styled with Space Grotesk uppercase labels
- Background changed to `surface-container-low`

### NewsTicker (`news-ticker.tsx`)
- Removed the static "LIVE" label badge
- Alert items get `BREAKING` badge (error-container), official items get `UPDATE` badge (secondary-container)
- Background changed to `surface-container-lowest`

### SourceHealthBar (`source-health-bar.tsx`)
- Restyled as "Intelligence Sources" card with `rounded-lg`
- Space Grotesk heading with `tracking-[0.2em]`
- Simplified to name + health dot layout

### WatchlistPanel (`watchlist-panel.tsx`)
- Added PlusCircle icon next to heading
- Cards use tonal surface shifts (`surface-container` / `surface-container-high` on hover)
- Alert count badges use `error-container` background
- Shows "Clear" / "No activity" for zero-alert locations

### AlertHero (`alert-hero.tsx`)
- `rounded-xl` card with `border-e-4 border-error` accent (RTL-safe)
- Error glow shadow when alert is active
- "CRITICAL ALERT" badge at top
- Title sized up to `text-3xl font-black`
- 3-column stats grid for location, severity, source
- Empty state: centered with larger checkmark icon, `min-h-48`

### OfficialGuidanceCard (`official-guidance-card.tsx`)
- `rounded-xl` card with `border-e-4 border-primary` accent
- Added Info icon next to heading
- 2-column grid layout: text + checklist items with CheckCircle icons
- Replaced sky palette with MD3 primary tokens

### StreamPanel (`stream-panel.tsx`)
- Moved into center column (was full-width bottom row)
- `rounded-xl` card with `surface-container-lowest` background
- Added red pulsing live indicator dot
- `aspect-video` container with signal strength overlay

### FeedPanel (`feed-panel.tsx`)
- `rounded-xl` card filling full sidebar height
- Tab indicator changed from amber bottom bar to primary `border-b-2`
- Added "View Full History" button at bottom
- Updated timestamp display in footer

### FeedTabButton (`feed-tab-button.tsx`)
- Space Grotesk `text-[10px] uppercase tracking-widest font-bold`
- Active: `border-b-2 border-primary text-primary`
- Inactive: `text-outline hover:text-on-surface`

### FeedItemCard (`feed-item-card.tsx`)
- Added timestamp + severity badge header row
- Severity labels: "Critical" (error), "Official" (emerald), "Update" (secondary)
- Title hover effect: `text-primary`
- Uniform separator: `h-px bg-outline-variant/10`

### LocaleSwitcher (`locale-switcher.tsx`)
- Compact mode renders pill-style toggle buttons instead of `<select>`
- Active locale: `border-b-2 border-primary text-primary`

### Deploy Response Button
- Added decorative gradient CTA at bottom of left sidebar
- `bg-gradient-to-r from-primary to-primary-container`

## Files Modified

| File | Change |
|------|--------|
| `src/app/globals.css` | MD3 tokens, scrollbar, glass-panel, animations |
| `src/app/layout.tsx` | Inter + Space Grotesk fonts |
| `src/components/dashboard/dashboard-shell.tsx` | Grid layout, StreamPanel move, Deploy button |
| `src/components/dashboard/command-bar.tsx` | Full header redesign |
| `src/components/dashboard/filter-bar.tsx` | MD3 restyle + search icon |
| `src/components/dashboard/news-ticker.tsx` | MD3 colors + badge variants |
| `src/components/dashboard/source-health-bar.tsx` | Intelligence Sources restyle |
| `src/components/dashboard/watchlist-panel.tsx` | MD3 restyle + add icon |
| `src/components/dashboard/alert-hero.tsx` | Hero card redesign |
| `src/components/dashboard/official-guidance-card.tsx` | MD3 restyle + 2-col layout |
| `src/components/streams/stream-panel.tsx` | MD3 restyle + live indicator |
| `src/components/dashboard/feed-panel.tsx` | Right sidebar restyle |
| `src/components/dashboard/feed-tab-button.tsx` | Tab indicator change |
| `src/components/dashboard/feed-item-card.tsx` | Feed item restyle |
| `src/components/i18n/locale-switcher.tsx` | Pill toggle in compact mode |

---

## Feed Page Redesign

Redesigned the standalone feed page (`/[locale]/feed`) to match the Stitch "Magen Feed (Fixed Top Nav)" design for both desktop (1280px) and mobile (390px).

### Layout

#### Desktop
```
[CommandBar h-14 fixed — "Intel" tab active]
[FilterBar — search + region dropdown]
[Main — max-w-4xl centered, scrollable]
  [AlertHero — reused from dashboard]
  [CHRONOLOGICAL FEED section label]
    [FeedTabButton row: Alerts | News | Official]
    [FeedItemCard list — full-width cards with type badges]
  [LIVE MEDIA COVERAGE section label]
    [StreamPanel — reused from dashboard]
```

#### Mobile
```
[CommandBar h-14 fixed]
[FilterBar]
[Main — full-width, scrollable]
  [AlertHero]
  [CHRONOLOGICAL FEED]
  [LIVE MEDIA COVERAGE]
[MobileBottomNav — fixed bottom, 4 tabs]
```

### Key Changes from Previous Feed Page

- **Shared CommandBar** — replaces custom header; `activeHref` prop makes "Intel" tab active
- **FilterBar** — adds region + search filtering (reused from dashboard)
- **AlertHero** — reused directly from dashboard (was a custom inline implementation)
- **Full-width feed cards** — `FeedItemCard` `variant="full"` with type badges, description text, card backgrounds
- **StreamPanel** — "Live Media Coverage" section at bottom (reused from dashboard)
- **MobileBottomNav** — fixed bottom nav with Dashboard/Map/Intel/Alerts tabs (`md:hidden`)
- **MD3 tokens throughout** — replaced all oklch/slate/rose colors
- **Eliminated duplicate API call** — uses first alert from `alertsState.data` instead of separate `getAlertsData(1)`

### Component Changes

#### CommandBar (`command-bar.tsx`)
- Added `activeHref?: string` prop (default `"/map"`)
- Nav tab active state derived dynamically from `activeHref` instead of hardcoded

#### FeedItemCard (`feed-item-card.tsx`)
- Added `variant?: "compact" | "full"` prop (default `"compact"`)
- `"full"` variant: `rounded-lg bg-md3-surface-container-low p-4`, colored type badge, description/summary line
- `"compact"` variant: unchanged (dashboard sidebar)

#### MobileBottomNav (`mobile-bottom-nav.tsx`) — NEW
- Fixed bottom `h-16`, `bg-md3-surface-container-low`
- 4 tabs: Dashboard (LayoutGrid), Map (Map), Intel (Database), Alerts (Bell)
- Space Grotesk `text-[10px]` uppercase labels
- Locale-aware links via `next-intl` navigation

#### LiveFeedPage (`live-feed-page.tsx`) — REWRITTEN
- Composes: CommandBar + FilterBar + AlertHero + feed section + StreamPanel + MobileBottomNav
- Uses `useFeedPageFilters` hook for region + search filtering
- Uses `useSourceHealth` for CommandBar health indicator
- Uses `useStreams` for StreamPanel data

### New Files

| File | Purpose |
|------|---------|
| `src/components/feed/hooks/use-feed-page-filters.ts` | Simpler filter hook for feed page (no ticker/watchlist deps) |
| `src/components/navigation/mobile-bottom-nav.tsx` | Mobile bottom navigation component |

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/command-bar.tsx` | Added `activeHref` prop for dynamic nav tab highlighting |
| `src/components/dashboard/feed-item-card.tsx` | Added `variant` prop with `"full"` card layout |
| `src/components/feed/live-feed-page.tsx` | Full rewrite — MD3 design, shared components |
| `src/components/feed/live-feed-page.test.tsx` | Updated for new content type and component structure |
| `src/app/[locale]/feed/page.tsx` | Expanded content props for new sub-components |
| `src/messages/en.json` | Added feed page i18n keys (section labels, nav, filters, streams) |
| `src/messages/he.json` | Added Hebrew translations for new keys |

---

## Map Page Redesign

Redesigned the map page (`/[locale]/map`) to match the Stitch "Magen Map (Top Nav)" design. Transformed the layout from a vertical scrollable page into a **full-screen map** with **floating overlay panels**, consistent with the dashboard and feed redesigns.

### Layout

#### Before
```
[Custom header (h-12, sticky) — title, theme/locale toggles]
[Legend + Overlay toggle buttons row]
[MapPanel (62vh container)]
[MapWatchlistManager — 2-column grid below map]
[MapSummaryCards — alert/watchlist count cards]
```

#### After
```
[CommandBar (h-14, fixed) — "Map" tab active]
[Full-screen map (fills viewport)]
  [StatusBar — floating top-start: "X Active Alerts · Y Watched Areas Affected"]
  [MapLayers — floating bottom-start: vertical panel with toggle switches]
  [Legend — floating bottom-center: compact icon bar]
  [Watchlist — floating end-side: location cards with alert badges]
[MobileBottomNav — fixed bottom, md:hidden]
```

Key structural changes:
- Map fills all available viewport space (no 62vh constraint)
- All surrounding UI rendered as floating panels with `absolute` positioning over the map
- Shared `CommandBar` replaces custom header (with `activeHref="/map"`)
- `MobileBottomNav` added for mobile navigation
- `useSourceHealth` hook integrated for CommandBar health indicator
- Panels use glassmorphism: `bg-md3-surface-container-low/90 backdrop-blur-sm`
- RTL-safe positioning via `start`/`end` utilities

### Component Changes

#### MapPreview (`map-preview.tsx`) — REWRITTEN
- Removed custom sticky header → uses shared `CommandBar`
- Removed `MapPanel` wrapper → map renders directly in flex container
- Removed `MapSummaryCards` → replaced by `MapStatusBar`
- Added `useSourceHealth` hook for CommandBar health indicator
- Layout: `flex min-h-screen flex-col bg-md3-surface pt-14 pb-16 md:pb-0`
- Floating panels positioned absolutely inside `relative flex-1` container

#### MapStatusBar (`map-status-bar.tsx`) — NEW
- Compact floating bar showing alert count + affected watchlist count
- `AlertTriangle` icon (error color) + `MapPin` icon (secondary color)
- Space Grotesk uppercase labels
- Replaces `MapSummaryCards` component

#### MapOverlayControls (`map-overlay-controls.tsx`) — REWRITTEN
- Horizontal toggle buttons → vertical floating panel with icon + label + toggle switch per row
- Custom `ToggleSwitch` component with `role="switch"` and `aria-checked`
- Layer rows: Shelters (sky), Hospitals (emerald), Road Closures (slate), Alert Zones (decorative)
- Container: `w-52 rounded-lg bg-md3-surface-container-low/90 backdrop-blur-sm`
- Title: Space Grotesk `text-[10px] tracking-[0.2em]`

#### MapLegend (`map-legend.tsx`) — RESTYLED
- Removed title text, simplified to icon + label pairs only
- Compact horizontal bar: Alert, Shelter, Hospital
- MD3 semantic icon colors: error, sky-400, emerald-400
- `text-[11px] uppercase tracking-wider text-md3-on-surface-variant`

#### MapWatchlistManager (`map-watchlist-manager.tsx`) — REWRITTEN
- 2-column grid → single-column floating sidebar (`w-72`)
- Removed "Suggested locations" section (suggestion engine preserved for future "+ Add" popover)
- Header: "WATCHLIST" uppercase + `+ Add` button with `PlusCircle` icon
- Location cards with name, district, remove button
- Active alert badge: `bg-md3-error-container text-[10px] uppercase`
- Priority cues shown inline
- Hidden on mobile: `hidden md:block`

#### Unused Components
- `MapPanel` — no longer imported (map fills viewport directly)
- `MapSummaryCards` — no longer imported (replaced by `MapStatusBar`)

### New Files

| File | Purpose |
|------|---------|
| `src/components/map/map-status-bar.tsx` | Floating status bar with alert/watchlist counts |

### Files Modified

| File | Change |
|------|--------|
| `src/components/map/map-preview.tsx` | Full rewrite — full-screen layout, floating panels, shared CommandBar |
| `src/components/map/map-overlay-controls.tsx` | Rewritten — vertical panel with toggle switches |
| `src/components/map/map-legend.tsx` | Restyled — compact floating bar with MD3 tokens |
| `src/components/map/map-watchlist-manager.tsx` | Rewritten — floating sidebar with location cards |
| `src/app/[locale]/map/page.tsx` | Restructured content props for new component shape |
| `src/components/map/map-preview.test.tsx` | Updated mocks, content fixture, and assertions for new structure |
| `src/messages/en.json` | Updated map page i18n keys (CommandBar, StatusBar, BottomNav, layers, watchlist) |
| `src/messages/he.json` | Updated Hebrew translations for new keys |

### Unchanged Files

| File | Reason |
|------|--------|
| `src/components/map/crisis-map.tsx` | MapLibre map with all markers/layers — untouched |
| `src/components/ui/map.tsx` | Map wrapper library — untouched |
| `src/components/map/map-panel.tsx` | No longer imported but left in place |
| `src/components/map/map-summary-cards.tsx` | No longer imported but left in place |

## Validation

All checks pass:
- `npm run typecheck` — no errors
- `npm run test` — 111/111 tests passing
- `npm run build` — successful production build
- `npm run lint` — no new errors (1 pre-existing error in `theme-provider.tsx`)
