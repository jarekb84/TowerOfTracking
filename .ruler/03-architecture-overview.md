# Architecture Overview

## Core Technology Stack

- **TanStack Start**: Full-stack React framework with SSR
- **TanStack Router**: File-based routing system
- **TanStack Table**: Headless table component for data display
- **Tailwind CSS v4**: Styling with `@theme` directive (no config file)
- **shadcn/ui**: Component library built on Radix UI primitives
- **Recharts**: Chart library for data visualization
- **TypeScript**: Full type safety throughout
- **Vitest + React Testing Library**: Testing infrastructure

## Data Flow Architecture

**Context-Based State Management:**
- `DataProvider` (`src/contexts/data-context.tsx`): Manages game run data with localStorage persistence

**Data Processing Pipeline:**
- Raw clipboard data → parsing → normalization → `ParsedGameRun` interface
- Handles shorthand number formats (100K, 15.2M, 1.5B, up to 1e63) and duration strings (7H 45M 35S)
- See `src/shared/formatting/number-scale.ts` for number parsing/formatting

## Number & Date Formatting (CRITICAL)

**NEVER format numbers or dates manually.** All formatting MUST use shared utilities - this ensures locale support and consistency. Before writing any number/date formatting code, use these:

**Dates** (`src/shared/formatting/date-formatters.ts`):
- `parseBattleDate()` - Parse dates from game export (handles multiple locale formats)
- `formatDisplayDate()`, `formatDisplayDateTime()` - Locale-aware display
- `formatIsoDate()`, `formatCanonicalBattleDate()` - Storage format (US-centric)

**Numbers** (`src/shared/formatting/number-scale.ts`):
- `parseShorthandNumber()` - Parse "100K", "1.5M" with locale-aware separators
- `formatLargeNumber()` - Format numbers with scale suffixes

**Canonical Data Format:**
- **Storage/Memory**: US-centric format (e.g., "Oct 14, 2025 13:14")
- **User Input**: Parsed according to user's locale settings
- **Display Output**: Formatted according to user's locale settings

**NEVER construct dates or format numbers directly.** Always use the shared utilities.

## Analytics Features

The app includes multiple analysis views in `src/features/analysis/`:
- **Time Series**: Configurable charts (run, daily, weekly, monthly, yearly periods)
- **Tier Stats**: Performance metrics per tier with sorting
- **Tier Trends**: Trend analysis across periods with aggregation options
- **Deaths Radar**: Radar chart analyzing death causes by tier
- **Source Analysis**: Breakdown of coin/damage sources
- **Field Analytics**: Per-field analysis with field selection
- **Coverage Report**: Data coverage and completeness analysis

## Reusing Existing Utilities

**CRITICAL**: Before implementing any data transformation, check if it already exists:

**Number/Date Formatting** (`src/shared/formatting/`):
- `formatLargeNumber()` - Display any number with K/M/B/T suffixes
- `parseShorthandNumber()` - Parse user input like "100K", "1.5M"
- `formatDisplayDate()` - Display dates to users
- Never write custom number formatting - use these utilities

**Data Grouping/Aggregation** (`src/features/analysis/`):
- Period grouping (daily, weekly, monthly, yearly)
- Tier-based grouping and filtering
- Field aggregation strategies (sum, avg, max, min)

**Field Configuration** (`src/shared/domain/fields/`):
- Field metadata and display config
- Field formatters and extractors
- Numeric field detection

**Filters** (`src/shared/domain/filters/`):
- Tier filtering
- Duration filtering
- Period count options

**Colors**: Check if field/metric colors are already defined before creating new ones. Consistent colors improve UX.

## SSR Considerations

All localStorage and DOM access must be wrapped in `typeof window !== 'undefined'` checks.

## Testing Infrastructure

- Hook tests MUST use `.tsx` extension for `renderHook()`
- Use `act()` for state updates
- Use `vi.useFakeTimers()` for debounced functionality

## Styling System

- Tailwind v4 with `@theme` directive in CSS
- Dark tower defense theme with orange (#f97316) accent
