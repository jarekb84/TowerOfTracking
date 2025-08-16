# Purpose

This file provides guidance to AI agents when working with code in this repository.

## Project Overview

TowerOfTracking is a web application for tracking and analyzing tower defense game statistics. Users can import game run data via tab-delimited clipboard content, view runs in a sortable table, and analyze performance metrics over time.

## Development Commands

- **Development server**: `npm run dev` (runs on port 3000, but will auto-increment if occupied)
- **Build for production**: `npm run build`
- **Run tests**: `npm run test` (uses Vitest)
- **Production server**: `npm run start` (serves built files)
- **Preview production build**: `npm run serve`

## Architecture Overview

### Core Technology Stack
- **TanStack Start**: Full-stack React framework with SSR
- **TanStack Router**: File-based routing system
- **TanStack Table**: Headless table component for data display
- **Tailwind CSS v4**: Styling with `@theme` directive (no config file)
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI primitives (via shadcn/ui)
- **TypeScript**: Full type safety throughout

### Data Flow Architecture

**Context-Based State Management:**
- `DataProvider` (`src/contexts/data-context.tsx`): Manages game run data with localStorage persistence
- `ThemeProvider` (`src/contexts/theme-context.tsx`): Handles UI theming and configurable spacing system

**Data Processing Pipeline:**
- Raw clipboard data → `parseTabDelimitedData()` → `extractKeyStats()` → `ParsedGameRun` interface
- Handles shorthand number formats (100K, 15.2M, 1.5B) and duration strings (7H 45M 35S)
- Uses `human-format` library for number parsing and display

### Key Components Structure

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

### SSR Considerations

**Critical**: All localStorage and DOM access must be wrapped in `typeof window !== 'undefined'` checks to prevent SSR errors. Both contexts handle this pattern for:
- Initial state loading from localStorage
- Theme application to document element
- Data persistence operations

### Styling System

**Tailwind v4 Configuration:**
- Uses `@theme` directive in CSS instead of config file
- Custom spacing system with normal/condensed modes
- CSS custom properties for dynamic theming
- Dark tower defense theme with orange (#f97316) accent colors

### Data Model

**ParsedGameRun Interface:**
```typescript
{
  id: string;
  timestamp: Date;
  rawData: Record<string, string>;          // Original tab-delimited data
  parsedData: Record<string, number | string | Date>; // Processed values
  // Extracted key stats:
  tier: number;
  wave: number;
  coinsEarned: number;
  cellsEarned: number;
  realTime: number; // in seconds - use this field for duration calculations
  runType: 'farm' | 'tournament';
}
```

**Key Data Processing Notes:**
- Use `run.realTime` for all duration calculations, not `run.duration` 
- The `realTime` field contains the actual game duration in seconds
- Time series data supports 5 periods: run, daily, weekly, monthly, yearly
- Chart data aggregation functions automatically handle proper grouping and date formatting

## File Organization

**Feature-Based Architecture**: Code is organized by business features, not file types.

```
src/
  components/
    ui/                    # shadcn/ui components
      button.tsx          # Button component
      card.tsx           # Card component and variants
      dialog.tsx         # Modal dialog components
      input.tsx          # Input field component
      textarea.tsx       # Textarea component
      index.ts           # Component exports
  features/
    data-tracking/         # Game run tracking and management
      components/          # DataInput, DataProvider, TimeSeriesChart, TierStatsTable, DeathsRadarChart
      types/              # ParsedGameRun, GameRunFilters interfaces
      utils/              # Data parsing, chart data aggregation, and formatting utilities
      hooks/              # useData hook for state management
      index.ts           # Feature exports
    theming/             # Application theming system
      components/        # ThemeSettings, ThemeProvider
      types/            # ThemeConfig, ThemeMode interfaces  
      hooks/            # useTheme hook for theme management
      index.ts         # Feature exports
  shared/              # Cross-feature utilities
    lib/              # Common utilities (cn function)
  routes/             # TanStack Router file-based routing
```

## Analytics & Visualization Patterns

### Chart Component Architecture

**TimeSeriesChart Pattern**: Use the configurable `TimeSeriesChart` component for all time-based metric visualization:
```typescript
<TimeSeriesChart 
  metric="coins" | "cells"
  title="Chart Title"
  subtitle="Description"
  defaultPeriod="run" | "daily" | "weekly" | "monthly" | "yearly"
/>
```

**Time Period Configuration**: 
- Each period has a distinct color scheme (purple, green, orange, red, blue)
- Date formatting adapts automatically (e.g., "Jan 2024" for monthly, "2024" for yearly)
- Chart gradients and visual elements update dynamically based on selected period

**Interactive Table Pattern**: For statistical tables with sorting:
- Implement column sorting with visual indicators (↑↓ arrows)
- Use color-coded metrics (green for coins, red/pink for cells)
- Include summary statistics above table data
- Sort data by most relevant field by default (highest values first)

**Radar Chart Pattern**: For multi-dimensional analysis:
- Dynamic axis scaling based on actual data (divisible by 4 for clean grid lines)
- Toggle-based tier visibility with color coding
- Default to showing most relevant data (highest 3 tiers)
- Bold, prominent labels for better readability

### Data Aggregation Functions

**Available Time Periods**:
- `prepareTimeSeriesData()`: Master function that routes to appropriate aggregation
- `prepareWeeklyData()`: Groups by Monday-starting weeks
- `prepareMonthlyData()`: Groups by calendar months  
- `prepareYearlyData()`: Groups by calendar years
- All maintain proper sorting and date formatting

**Chart Data Processing**:
- Use `formatLargeNumber()` for Y-axis labels (100K, 1.5M, 2.3B format)
- Use `generateYAxisTicks()` for clean axis scaling
- Color configuration available in `TIME_PERIOD_CONFIGS` array

**Import Strategy**: Import from feature index files for clean dependencies:
```typescript
// ✅ Good - import from feature barrel and shadcn/ui
import { DataInput, useData, ParsedGameRun } from '../features/data-tracking';
import { ThemeSettings, useTheme } from '../features/theming';
import { Button, Card } from '../components/ui';

// ❌ Avoid - deep imports bypass feature boundaries  
import { DataInput } from '../features/data-tracking/components/data-input';
import { Button } from '../components/ui/button';
```

## Engineering Standards & Code Architecture Guidelines

**Write code with the mindset of a seasoned engineer with 20+ years of experience building extensible applications.**

### File Organization & Structure

**Feature-Based Architecture**: Organize code by features, not by file types. Group related components, types, styles, and utilities together.

```
src/features/
  feature-name/
    components/          # Feature-specific components
    types/              # TypeScript interfaces/types  
    utils/              # Feature-specific utilities
    hooks/              # Custom hooks for this feature
    styles/             # Feature-specific styles (if needed)
    sub-feature/        # Sub-features when complexity grows
      components/
      types/
      utils/
```

**File Size Limits**: Keep files focused and maintainable
- **Maximum 300 lines per file** - decompose when approaching this limit
- Apply **Single Responsibility Principle** - each file should have one primary reason to change
- **Composition over complexity** - break down complex components into smaller, focused pieces

**Co-location**: Keep related code together. If components, types, and utilities are tightly coupled to a specific feature, place them in the same feature directory.

### TypeScript Standards

**Strict Type Safety**: 
- Avoid `any` type - use proper typing or `unknown` with type guards
- Enable strict mode in TypeScript configuration
- Prefer explicit return types for functions
- Use type-only imports when appropriate: `import type { ... }`

**Type Organization**:
- Create dedicated `types/` directories within features
- Use descriptive interface/type names with clear business domain language
- Export types from feature index files for clean imports

### Component Architecture

**Decomposition Strategy**:
- When a component grows beyond 150 lines, look for extraction opportunities
- Extract logical sections into sub-components
- Create feature sub-directories when 3+ closely related components emerge
- Prefer hooks for stateful logic extraction

**Independence & Low Coupling**:
- Components should depend on abstractions, not concrete implementations
- Use dependency injection patterns for external dependencies
- Minimize prop drilling with appropriate context boundaries
- Design components to be easily testable in isolation

### Engineering Principles

**Extensibility**: Design for change
- Use composition patterns over inheritance
- Implement interfaces for external dependencies
- Keep business logic separate from UI concerns
- Design APIs that can evolve without breaking changes

**Maintainability**: Code should be self-documenting
- Use descriptive variable and function names that express intent
- Prefer explicit over clever code
- Add comments for business logic rationale, not implementation details
- Structure code to minimize cognitive load

**Error Handling**: Be defensive
- Handle edge cases explicitly
- Use Result/Option patterns for fallible operations
- Validate data at system boundaries
- Provide meaningful error messages

## Special Considerations

**Data Parsing**: The app expects tab-delimited game statistics with property-value pairs. Key field mappings are handled via case-insensitive matching in `extractKeyStats()`.

**Demo Files**: Files prefixed with `demo` in routes can be safely deleted - they're TanStack Start examples.

**Future Supabase Integration**: The data layer is designed to eventually replace localStorage with Supabase for cross-device synchronization.