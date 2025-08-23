# Architecture Overview

## Core Technology Stack

- **TanStack Start**: Full-stack React framework with SSR
- **TanStack Router**: File-based routing system
- **TanStack Table**: Headless table component for data display
- **Tailwind CSS v4**: Styling with `@theme` directive (no config file)
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI primitives (via shadcn/ui)
- **TypeScript**: Full type safety throughout

## Data Flow Architecture

**Context-Based State Management:**
- `DataProvider` (`src/contexts/data-context.tsx`): Manages game run data with localStorage persistence
- `ThemeProvider` (`src/contexts/theme-context.tsx`): Handles UI theming and configurable spacing system

**Data Processing Pipeline:**
- Raw clipboard data → `parseTabDelimitedData()` → `extractKeyStats()` → `ParsedGameRun` interface
- Handles shorthand number formats (100K, 15.2M, 1.5B) and duration strings (7H 45M 35S)
- Uses `human-format` library for number parsing and display

## Key Components Structure

**Data Input Flow:**
- `DataInput` component → Modal dialog → Live preview → Save to context
- Clipboard integration with paste button functionality
- Real-time data validation and preview

**Table Display System:**
- `RunsTable` component with TanStack Table integration
- Expandable rows showing all 80+ raw data fields
- Sorting, filtering, and search capabilities
- Custom cell renderers for formatted numbers and durations

**Analytics & Visualization System:**
- `TimeSeriesChart` component: Configurable chart supporting multiple time periods (run, daily, weekly, monthly, yearly)
- `TierStatsTable` component: Interactive table showing max performance metrics per tier with column sorting
- `DeathsRadarChart` component: Radar chart analyzing death causes by tier with dynamic scaling and tier toggles
- Color-coded visualization system with consistent theming across chart types

## SSR Considerations

**Critical**: All localStorage and DOM access must be wrapped in `typeof window !== 'undefined'` checks to prevent SSR errors. Both contexts handle this pattern for:
- Initial state loading from localStorage
- Theme application to document element
- Data persistence operations

## Styling System

**Tailwind v4 Configuration:**
- Uses `@theme` directive in CSS instead of config file
- Custom spacing system with normal/condensed modes
- CSS custom properties for dynamic theming
- Dark tower defense theme with orange (#f97316) accent colors