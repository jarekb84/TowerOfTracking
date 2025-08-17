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

## Claude Code Development Workflow

### Mandatory Red-Green-Refactor Process

**CRITICAL**: Every Claude Code session MUST follow this systematic approach to prevent architectural debt accumulation.

#### Phase 1: Requirement Analysis (Red)
Before writing any code, ALWAYS use the `system-architect` agent to:

**Trigger the architect agent for ALL tasks involving:**
- Adding new features or components
- Modifying existing data structures
- Performance improvements 
- Bug fixes that touch core logic
- Any change affecting multiple files

**Example triggers:**
```
USER: "Add a new chart for tracking upgrades"
ASSISTANT: "I'll use the system-architect agent to analyze the existing chart infrastructure and implement this in a way that leverages our current TimeSeriesChart abstraction."

USER: "The data loading is slow"  
ASSISTANT: "Let me use the system-architect agent to investigate this performance issue and implement a solution that addresses the root cause while improving system scalability."
```

#### Phase 2: Implementation (Green)
Implement the minimal solution that satisfies requirements:
- Focus on making it work first
- Follow existing patterns and conventions
- Use TodoWrite to track implementation steps
- Maintain test coverage

#### Phase 3: Architecture Review & Refactor (Refactor)
**MANDATORY** after every implementation - analyze for:

**Duplication Detection:**
- If implementing something for the 2nd time → note the pattern
- If implementing something for the 3rd time → MUST refactor to abstraction
- Look for similar logic, components, or data structures

**Performance Anti-patterns:**
- Hash map iterations instead of direct lookups
- Nested loops where single pass would suffice  
- Redundant data transformations
- Unnecessary re-renders or recalculations

**Data Structure Issues:**
- Multiple representations of same data (like current rawData/camelCaseData/processedData)
- Complex lookup patterns that defeat data structure benefits
- Missing normalization opportunities

**Separation of Concerns:**
- Business logic mixed with presentation logic
- Components doing too many things
- Missing abstraction layers

### Known Architectural Issues to Fix

#### 3. **Pattern**: Component Duplication Prevention
When creating similar UI elements:
- First occurrence: Implement directly
- Second occurrence: Note similarity, consider abstraction  
- Third occurrence: MANDATORY extraction to reusable component

### Automatic Architect Agent Usage

**Before ANY code modification, check these conditions:**

1. **Feature Addition**: Adding new functionality → Use `system-architect`
2. **Performance Issue**: Investigating slowness → Use `system-architect`  
3. **Data Structure Change**: Modifying types/interfaces → Use `system-architect`
4. **Third Similar Implementation**: Creating 3rd similar thing → Use `system-architect`
5. **Cross-Feature Impact**: Changes affecting multiple features → Use `system-architect`

**Agent Invocation Pattern:**
```
"I'll use the system-architect agent to [analyze existing patterns/investigate the issue/design this feature] and implement a solution that [improves architecture/reduces complexity/follows established patterns]."
```

### Example Refactoring Scenarios

#### Scenario 1: Adding a Third Chart Type
```
USER: "Add a chart for tracking damage over time"

PHASE 1 (RED - Requirement Analysis):
ASSISTANT: "I'll use the system-architect agent to analyze our existing chart infrastructure. We already have TimeSeriesChart handling coins and cells metrics, so this would be the third chart implementation. Let me ensure we leverage the existing abstraction."

[System-architect agent analyzes TimeSeriesChart.tsx and confirms it's properly configurable]

PHASE 2 (GREEN - Implementation):
ASSISTANT: "Perfect! The TimeSeriesChart component is already designed for this. I'll add 'damage' as a new metric option and update the chart-data.ts utility to handle damage aggregation."

[Implements by extending existing TimeSeriesChart with new metric type]

PHASE 3 (REFACTOR - Architecture Review):
ASSISTANT: "Implementation complete. Architecture review: ✅ No duplication - leveraged existing abstraction. ✅ No performance issues. ✅ Maintains separation of concerns. The configurable design prevented the third-chart duplication problem."
```

#### Scenario 2: Component Duplication Pattern
```
USER: "Add a settings card for theme configuration"

PHASE 1 (RED - Requirement Analysis):
ASSISTANT: "I notice we already have similar card layouts in the runs table and data input areas. Let me check if this would be the third similar implementation requiring abstraction."

[Reviews existing card components and finds 2 similar patterns]

PHASE 2 (GREEN - Implementation):
ASSISTANT: "This would be our third card-based settings component. Instead of duplicating, I'll extract a common SettingsCard component and refactor the existing implementations to use it."

[Extracts abstraction and refactors existing code]

PHASE 3 (REFACTOR - Architecture Review):
ASSISTANT: "✅ Eliminated future duplication risk. ✅ Reduced codebase complexity. ✅ Created reusable abstraction for future settings sections."
```

#### Scenario 3: Performance Issue Detection
```
USER: "The run details view is rendering slowly"

PHASE 1 (RED - Requirement Analysis):
ASSISTANT: "I'll use the system-architect agent to investigate this performance issue and implement a solution that addresses the root cause while improving system scalability."

[System-architect agent analyzes run-details.tsx and identifies the O(n) findDataKey issue]

PHASE 2 (GREEN - Implementation):
ASSISTANT: "Found the issue: findDataKey() is doing O(n) iteration instead of O(1) hash lookup. I'll create a normalized key mapping during data processing to eliminate the iteration."

[Implements key normalization in data parser]

PHASE 3 (REFACTOR - Architecture Review):
ASSISTANT: "✅ Performance improved from O(n²) to O(1) lookup. ✅ Maintains existing API. ✅ Sets foundation for the planned data structure refactor. This change aligns with our goal to eliminate the triple data representation problem."
```

#### Scenario 4: Data Structure Modification
```
USER: "Add a new field for tracking power-ups used"

PHASE 1 (RED - Requirement Analysis):  
ASSISTANT: "I'll use the system-architect agent to analyze how this new field fits into our current data structure and whether this is an opportunity to address the triple representation issue."

[System-architect agent identifies this as good opportunity for data structure improvement]

PHASE 2 (GREEN - Implementation):
ASSISTANT: "This is a perfect opportunity to start migrating toward the single-field-object pattern. I'll implement the new field using the GameRunField interface and create a migration path for existing data."

[Implements new field with improved structure]

PHASE 3 (REFACTOR - Architecture Review):
ASSISTANT: "✅ New field uses improved data pattern. ✅ Created migration foundation. ✅ No performance regression. Next features should continue this pattern until we can fully refactor the data structure."
```

### Red-Green-Refactor Checklist

**Before Each Session:**
- [ ] Read user request carefully
- [ ] Identify if this triggers architect agent usage (see conditions above)
- [ ] If triggered, invoke system-architect agent before coding

**During Implementation:**
- [ ] Use TodoWrite to track progress
- [ ] Follow existing patterns and conventions
- [ ] Keep changes minimal and focused
- [ ] Maintain test coverage

**After Implementation:**
- [ ] Check for duplication opportunities (2nd/3rd occurrence rule)
- [ ] Verify no performance anti-patterns introduced
- [ ] Confirm separation of concerns maintained
- [ ] Consider if change improves or hurts overall architecture
- [ ] Mark todos complete and note any follow-up architectural work needed

**Session End:**
- [ ] Architecture review complete
- [ ] All todos marked complete
- [ ] Codebase left in better state than before

## Special Considerations

**Data Parsing**: The app expects tab-delimited game statistics with property-value pairs. Key field mappings are handled via case-insensitive matching in `extractKeyStats()`.

**Future Supabase Integration**: The data layer is designed to eventually replace localStorage with Supabase for cross-device synchronization.