# PRD: Field Analytics Page

## Executive Summary

Create a new Field Analytics page that leverages the existing `TimeSeriesChart` component to enable users to visualize **any numeric field** from their game run data over time. This extends the focused coin/cell analytics pages into a general-purpose field analysis tool, unlocking visualization capabilities for 80+ tracked game metrics.

**Key Benefits:**
- Reuses proven `TimeSeriesChart` component architecture
- Minimal new code - primarily UI for field selection
- Massive functionality gain - visualize any of 80+ numeric fields
- Consistent UX with existing coin/cell analytics pages
- Foundation for future multi-field comparison features

---

## Problem Statement

### Current State
Users can visualize only **2 metrics** over time:
- Coins earned (via [/charts/coins](/charts/coins))
- Cells earned (via [/charts/cells](/charts/cells))

These pages are nearly identical - they differ only in the `metric` prop passed to `TimeSeriesChart`.

### User Pain Point
The Tower game exports **80+ numeric fields** including:
- Wave progression metrics
- Damage statistics (dealt, taken, by weapon type)
- Resource earnings (shards, keys, etc.)
- Duration and timing metrics
- Enemy defeat counts
- Special ability usage stats

**Users cannot visualize trends for these metrics** without custom code changes for each field.

### Opportunity
The `TimeSeriesChart` component is already designed to be metric-agnostic. We can create a **single, reusable page** that allows users to select which field to chart, instantly unlocking analysis capabilities for all numeric game data.

---

## Goals & Non-Goals

### Goals
✅ **Primary**: Enable time-series visualization for any numeric field
✅ Provide intuitive field selection UI that scales to 80+ options
✅ Reuse existing time period controls (hourly/run/daily/weekly/monthly/yearly)
✅ Maintain visual consistency with existing analytics pages
✅ Support run type filtering (all/farm/tournament/milestone)
✅ Mobile-responsive design

### Stretch Goals
🎯 Field search/filtering (fuzzy search)
🎯 Recently viewed fields quick-access
🎯 Favorite fields persistence

### Non-Goals (Future Enhancements)
❌ Multi-field comparison on single chart (separate story)
❌ Field categorization/grouping UI (separate story)
❌ Alternative chart types (bar/pie/radar) (separate story)
❌ Custom aggregation functions beyond existing periods (separate story)
❌ Tier-based grouping/filtering (separate story)

---

## User Stories

### Primary User Story
**As a** Tower game player tracking performance metrics,
**I want to** visualize trends for any numeric field over time,
**So that** I can analyze performance patterns beyond just coins and cells.

**Acceptance Criteria:**
- [ ] I can select from all available numeric fields in my imported data
- [ ] The chart displays the selected field using the same time period controls as coin/cell pages
- [ ] I can switch between hourly/run/daily/weekly/monthly/yearly aggregation
- [ ] I can filter to farming-only runs or view all run types
- [ ] The page layout matches existing analytics pages (gradient header, card container)
- [ ] Chart tooltips show formatted values with proper units

### Supporting User Stories

**Field Discovery:**
- [ ] I can see a complete list of all chartable numeric fields
- [ ] I can identify what field is currently selected
- [ ] I can quickly switch between different fields

**Mobile Experience:**
- [ ] Field selector works on mobile devices
- [ ] Chart remains primary focus (minimal UI chrome)
- [ ] Responsive layout doesn't hide critical controls

---

## Design Specification

### Page Layout

**Route:** `/charts/fields`
**Component:** `FieldAnalyticsPage` in `src/routes/charts/fields.tsx`

**Visual Structure:**
```
┌─────────────────────────────────────────────────────┐
│  Gradient Header Section                            │
│  ┌───────────────────────────────────────────────┐  │
│  │ 📊 Field Analytics                            │  │
│  │ Analyze trends for any tracked metric         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Card Container (max-w-7xl)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │ Card Header (gradient accent)                 │  │
│  │  Field: [Damage Dealt ▼]        🔄 Refresh    │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │ Card Content                                  │  │
│  │                                               │  │
│  │  <TimeSeriesChart                             │  │
│  │    metric={selectedField}                     │  │
│  │    title="Damage Dealt Over Time"             │  │
│  │    ... />                                     │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Color Theme:**
- Gradient: Indigo/violet theme (distinct from coins=emerald, cells=pink)
- Header: `from-indigo-500 to-violet-600`
- Card accent: `border-t-4 border-indigo-500`

### Field Selection UI (MVP)

**Component:** Searchable dropdown selector
**Location:** In Card header, left-aligned
**Type:** `<Select>` component with search capability (shadcn/ui)

**Requirements:**
- **Searchable:** Fuzzy search through field names (case-insensitive, order-agnostic)
- **Scrollable:** Dropdown limited to 300px max-height with scroll
- **Grouped:** (Future) Categorize by field type (earnings, combat, resources, etc.)
- **Current selection display:** Shows currently selected field name
- **Clear visual hierarchy:** Field name prominent, secondary metadata subtle

**Search Behavior:**
- Filter-as-you-type with fuzzy matching
- Match against field display names
- Show "No matches" state when search yields no results
- Display match count: "Showing X of Y fields"

**UI Pattern Reference:**
- Use existing `FieldSearch` component pattern from tier-trends ([field-search.tsx](src/shared/domain/fields/field-search.tsx))
- Adapt for single-selection dropdown vs. filter list
- Consider shadcn/ui `<Command>` component for search + select combo

### Field Data Source

**Field Discovery Logic:**
```typescript
// Pseudocode - actual implementation
import { extractNumericFieldNames } from '@/shared/domain/fields/field-discovery'

const availableFields = extractNumericFieldNames(runs)
// Returns: ['coinsEarned', 'cellsEarned', 'wave', 'realTime', 'damage_dealt', ...]

const fieldOptions = availableFields.map(fieldKey => ({
  value: fieldKey,
  label: formatFieldDisplayName(fieldKey), // "damage_dealt" → "Damage Dealt"
  dataType: getFieldDataType(fieldKey)     // 'number' | 'duration'
}))
```

**Numeric Field Filtering:**
- Include: `ParsedGameRun` cached properties (`tier`, `wave`, `coinsEarned`, `cellsEarned`, `realTime`)
- Include: All `fields` entries with `dataType === 'number'` or `dataType === 'duration'`
- Exclude: String fields, date/time fields (unless explicitly requested)
- Exclude: Internal fields (`_date`, `_time`, `_notes`, `_runType`) unless useful for analysis

**Field Naming Convention:**
- Use human-readable labels: `damage_dealt` → "Damage Dealt"
- Preserve user-imported field names from CSV (original keys)
- Handle shorthand formats (100K, 15.2M, etc.) via existing `human-format` parsing

### TimeSeriesChart Integration

**Current Limitation:**
`TimeSeriesChart` accepts `metric: 'coins' | 'cells'` - hardcoded to two metrics.

**Required Enhancement:**
Extend `TimeSeriesChart` to accept:
```typescript
interface TimeSeriesChartProps {
  metric: string                    // ✨ Changed from 'coins' | 'cells' to any field key
  title: string
  subtitle?: string
  defaultPeriod?: TimePeriod
  showFarmingOnly?: boolean
  valueFormatter?: (value: number) => string  // ✨ Optional custom formatter
}
```

**Data Aggregation:**
- Reuse existing aggregation logic from [chart-data.ts](src/features/analysis/time-series/chart-data.ts)
- Generalize `prepareCoinsPerRunData()` → `prepareFieldPerRunData(runs, fieldKey)`
- Generalize `prepareCoinsPerHourData()` → `prepareFieldPerHourData(runs, fieldKey)`
- Route aggregation based on field data type (number vs. duration)

**Implementation Note:**
- Duration fields (`realTime`) may need special handling - chart per-run duration, or derive rate metrics
- Number fields aggregate via sum/average as appropriate
- Consider field-specific formatting (coins use commas, percentages use %, etc.)

### Default Field Selection

**On First Load:**
- Default to `coinsEarned` (most common use case)
- Display subtitle: "Select a field from the dropdown to analyze different metrics"

**Persistence (Future):**
- Store last selected field in localStorage: `fieldAnalytics.lastField`
- Restore on page revisit

### Run Type Filtering

**Location:** Integrated within `TimeSeriesChart` (existing functionality)
**Options:** All Runs | Farming Only | Tournament Only | Milestone Only
**Default:** "Farming Only" (consistent with coin/cell pages)

**UI:** Radio buttons or segmented control above chart (existing pattern)

---

## Technical Specification

### File Structure

```
src/
├── routes/
│   └── charts/
│       └── fields.tsx                          # ✨ NEW: Field Analytics page route
├── features/
│   └── analysis/
│       ├── time-series/
│       │   ├── time-series-chart.tsx           # ⚙️ MODIFIED: Accept any metric string
│       │   ├── chart-data.ts                   # ⚙️ MODIFIED: Generalize aggregation functions
│       │   └── chart-types.ts                  # (No changes needed)
│       └── field-analytics/                    # ✨ NEW: Feature directory
│           ├── field-selector.tsx              # ✨ NEW: Searchable field dropdown
│           ├── use-field-selector.ts           # ✨ NEW: Field selection state hook
│           ├── field-selector.test.tsx         # ✨ NEW: Unit tests
│           └── use-field-selector.test.tsx     # ✨ NEW: Hook tests
├── shared/
│   └── domain/
│       └── fields/
│           ├── field-discovery.ts              # ⚙️ MODIFIED: Add extractNumericFieldNames()
│           └── field-formatters.ts             # ✨ NEW: Field-specific display formatters
```

### Implementation Details

#### 1. Extend TimeSeriesChart Component

**File:** `src/features/analysis/time-series/time-series-chart.tsx`

**Changes:**
```typescript
// BEFORE
interface TimeSeriesChartProps {
  metric: 'coins' | 'cells'  // ❌ Hardcoded
  // ...
}

// AFTER
interface TimeSeriesChartProps {
  metric: string              // ✅ Any field key
  title: string
  subtitle?: string
  defaultPeriod?: TimePeriod
  showFarmingOnly?: boolean
  valueFormatter?: (value: number) => string  // ✅ Custom formatting
}
```

**Logic Changes:**
- Replace metric-specific switch statements with generic field extraction
- Use `run.fields[metric]?.value ?? run[metric]` to support both cached and dynamic fields
- Apply `valueFormatter` if provided, else use `formatLargeNumber()`

#### 2. Generalize Aggregation Functions

**File:** `src/features/analysis/time-series/chart-data.ts`

**New Functions:**
```typescript
export function prepareFieldPerRunData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  return runs
    .map(run => {
      const value = extractFieldValue(run, fieldKey)
      return {
        date: formatDateForChart(run.battleDate),
        value: value ?? 0,
        timestamp: run.battleDate.getTime(),
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}

export function prepareFieldPerHourData(
  runs: ParsedGameRun[],
  fieldKey: string
): ChartDataPoint[] {
  return runs
    .filter(run => run.realTime > 0)
    .map(run => {
      const value = extractFieldValue(run, fieldKey)
      const hourlyRate = ((value ?? 0) / run.realTime) * 3600
      return {
        date: formatDateForChart(run.battleDate),
        value: hourlyRate,
        timestamp: run.battleDate.getTime(),
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)
}

function extractFieldValue(run: ParsedGameRun, fieldKey: string): number | undefined {
  // Check cached properties first (tier, wave, coinsEarned, cellsEarned, realTime)
  if (fieldKey in run) {
    return typeof run[fieldKey] === 'number' ? run[fieldKey] : undefined
  }

  // Check dynamic fields
  const field = run.fields[fieldKey]
  if (!field) return undefined

  // Parse based on data type
  if (field.dataType === 'number') {
    return typeof field.value === 'number' ? field.value : parseFloat(field.value)
  }

  if (field.dataType === 'duration') {
    // Duration fields store seconds as number
    return typeof field.value === 'number' ? field.value : undefined
  }

  return undefined
}
```

**Extend Existing Functions:**
- Modify `prepareTimeSeriesData()` to accept `metric: string` instead of `'coins' | 'cells'`
- Route to generic `prepareFieldPerRunData()` / `prepareFieldPerHourData()`
- Daily/weekly/monthly aggregations use same `groupRunsByDateKey()` logic

#### 3. Create Field Selector Component

**File:** `src/features/analysis/field-analytics/field-selector.tsx`

**Component Structure:**
```tsx
interface FieldSelectorProps {
  selectedField: string
  onFieldChange: (fieldKey: string) => void
  availableFields: FieldOption[]
}

interface FieldOption {
  value: string        // Field key (e.g., 'damage_dealt')
  label: string        // Display name (e.g., 'Damage Dealt')
  dataType: string     // 'number' | 'duration'
}

export function FieldSelector({ selectedField, onFieldChange, availableFields }: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const filteredFields = useMemo(() =>
    fuzzyFilter(availableFields, searchTerm),
    [availableFields, searchTerm]
  )

  return (
    <Select value={selectedField} onValueChange={onFieldChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a field to analyze" />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
          <div className="text-xs text-slate-400 mb-2">
            Showing {filteredFields.length} of {availableFields.length} fields
          </div>
        </div>
        <SelectGroup>
          {filteredFields.map(field => (
            <SelectItem key={field.value} value={field.value}>
              {field.label}
              <span className="text-xs text-slate-400 ml-2">({field.dataType})</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
```

**Fuzzy Search Logic:**
- Use existing `filterFieldTrends()` logic from [use-field-filter.ts](src/features/settings/column-config/use-field-filter.ts)
- Match on field label (case-insensitive)
- Support partial matches: "dam" matches "Damage Dealt"

#### 4. Create Field Selector Hook

**File:** `src/features/analysis/field-analytics/use-field-selector.ts`

**Hook Interface:**
```typescript
interface UseFieldSelectorReturn {
  selectedField: string
  setSelectedField: (field: string) => void
  availableFields: FieldOption[]
  isLoading: boolean
}

export function useFieldSelector(runs: ParsedGameRun[]): UseFieldSelectorReturn {
  const [selectedField, setSelectedField] = useState<string>('coinsEarned')

  const availableFields = useMemo(() => {
    const numericFields = extractNumericFieldNames(runs)
    return numericFields
      .map(fieldKey => ({
        value: fieldKey,
        label: formatFieldDisplayName(fieldKey),
        dataType: getFieldDataType(runs, fieldKey),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [runs])

  return {
    selectedField,
    setSelectedField,
    availableFields,
    isLoading: runs.length === 0,
  }
}
```

**Field Extraction Logic:**
- Scan all runs to discover available fields
- Filter to numeric/duration fields only
- Sort alphabetically by display name
- Cache results (memoized)

#### 5. Create Field Analytics Page

**File:** `src/routes/charts/fields.tsx`

**Page Component:**
```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { TimeSeriesChart } from '@/features/analysis/time-series/time-series-chart'
import { FieldSelector } from '@/features/analysis/field-analytics/field-selector'
import { useFieldSelector } from '@/features/analysis/field-analytics/use-field-selector'
import { useData } from '@/contexts/data-context'

export const Route = createFileRoute('/charts/fields')({
  component: FieldAnalyticsPage,
})

function FieldAnalyticsPage() {
  const { runs } = useData()
  const { selectedField, setSelectedField, availableFields } = useFieldSelector(runs)

  // Generate title from selected field
  const chartTitle = useMemo(() =>
    `${formatFieldDisplayName(selectedField)} Over Time`,
    [selectedField]
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-lg shadow-lg">
              <span className="text-4xl">📊</span>
              <h1 className="text-3xl font-bold text-white">Field Analytics</h1>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Analyze trends for any tracked metric. Select a field to visualize performance over time.
          </p>
        </div>

        {/* Chart Card */}
        <Card className="bg-slate-800/50 border-slate-700 shadow-xl border-t-4 border-indigo-500">
          <CardHeader className="border-b border-slate-700 bg-gradient-to-r from-indigo-500/10 to-violet-600/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-100 flex items-center gap-3">
                <span>Field:</span>
                <FieldSelector
                  selectedField={selectedField}
                  onFieldChange={setSelectedField}
                  availableFields={availableFields}
                />
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {runs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No run data available. Import your game data to get started.</p>
              </div>
            ) : (
              <TimeSeriesChart
                metric={selectedField}
                title={chartTitle}
                defaultPeriod="hourly"
                showFarmingOnly={true}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

#### 6. Add Field Discovery Utilities

**File:** `src/shared/domain/fields/field-discovery.ts`

**New Function:**
```typescript
/**
 * Extract all numeric field names from parsed game runs
 * Includes cached properties (tier, wave, coins, cells, realTime)
 * and dynamic fields with dataType === 'number' or 'duration'
 */
export function extractNumericFieldNames(runs: ParsedGameRun[]): string[] {
  if (runs.length === 0) return []

  const numericFields = new Set<string>()

  // Add cached numeric properties
  const cachedNumericProps = ['tier', 'wave', 'coinsEarned', 'cellsEarned', 'realTime']
  cachedNumericProps.forEach(prop => numericFields.add(prop))

  // Scan all runs for dynamic numeric fields
  runs.forEach(run => {
    Object.entries(run.fields).forEach(([key, field]) => {
      if (field.dataType === 'number' || field.dataType === 'duration') {
        numericFields.add(key)
      }
    })
  })

  return Array.from(numericFields).sort()
}
```

**File:** `src/shared/domain/fields/field-formatters.ts` (NEW)

**Formatting Utilities:**
```typescript
/**
 * Convert field key to human-readable display name
 * Examples:
 *   'coinsEarned' → 'Coins Earned'
 *   'damage_dealt' → 'Damage Dealt'
 *   'wave' → 'Wave'
 */
export function formatFieldDisplayName(fieldKey: string): string {
  // Handle camelCase
  const withSpaces = fieldKey.replace(/([A-Z])/g, ' $1')

  // Handle snake_case
  const cleaned = withSpaces.replace(/_/g, ' ')

  // Capitalize each word
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim()
}

/**
 * Get field-specific value formatter for chart tooltips/axis
 */
export function getFieldFormatter(fieldKey: string, dataType: string): (value: number) => string {
  // Duration fields show as "HH:MM:SS" or "Xh Ym Zs"
  if (dataType === 'duration' || fieldKey === 'realTime') {
    return formatDuration
  }

  // Coin/cell fields use large number formatting (K, M, B, etc.)
  if (fieldKey.includes('coin') || fieldKey.includes('cell')) {
    return formatLargeNumber
  }

  // Default: numeric with commas
  return (value: number) => value.toLocaleString()
}
```

---

## Testing Strategy

### Unit Tests

**Test Files:**
- `src/features/analysis/field-analytics/field-selector.test.tsx`
- `src/features/analysis/field-analytics/use-field-selector.test.tsx`
- `src/shared/domain/fields/field-discovery.test.ts`
- `src/shared/domain/fields/field-formatters.test.ts`

**Coverage Requirements:**
- ✅ `extractNumericFieldNames()`: Returns correct fields for various run data
- ✅ `formatFieldDisplayName()`: Handles camelCase, snake_case, single words
- ✅ `getFieldFormatter()`: Returns correct formatter for duration/coin/generic fields
- ✅ `useFieldSelector`: Initializes with default field, updates on selection change
- ✅ `FieldSelector`: Renders options, filters on search, calls onChange handler
- ✅ Fuzzy search: Matches partial/case-insensitive/order-agnostic queries

### Integration Tests

**Test File:** `src/routes/charts/fields.integration.test.tsx`

**Happy Path Test:**
1. Render page with sample run data
2. Verify default field ("Coins Earned") is selected
3. Open field selector dropdown
4. Search for "damage"
5. Select "Damage Dealt" option
6. Verify chart title updates to "Damage Dealt Over Time"
7. Verify chart renders with damage data points

**Edge Cases:**
- No run data: Shows empty state message
- Field with zero values: Chart renders but shows flat line
- Field with sparse data: Chart handles missing data points gracefully

### Manual Testing Checklist

- [ ] Page loads without errors
- [ ] Default field (Coins Earned) is pre-selected
- [ ] Field selector dropdown shows all numeric fields (80+)
- [ ] Search filters field list in real-time
- [ ] Selecting a field updates chart title and data
- [ ] Time period controls work (hourly/run/daily/weekly/monthly/yearly)
- [ ] Run type filter works (all/farm/tournament/milestone)
- [ ] Chart tooltip shows field values with proper formatting
- [ ] Mobile: Field selector is usable on small screens
- [ ] Mobile: Chart remains primary focus (no sidebar UI)
- [ ] Gradient theme distinct from coins (emerald) and cells (pink)

---

## Rollout Plan

### Phase 1: MVP Implementation (This PR)
- ✅ Extend `TimeSeriesChart` to accept any metric string
- ✅ Generalize aggregation functions in `chart-data.ts`
- ✅ Create `FieldSelector` component with search
- ✅ Create `useFieldSelector` hook
- ✅ Create `/charts/fields` page route
- ✅ Add field discovery and formatting utilities
- ✅ Write comprehensive unit tests (~100% coverage for logic)
- ✅ Write single happy-path integration test

### Phase 2: Future Enhancements (Separate Stories)
- [ ] **Field Categorization**: Group fields by type (earnings, combat, resources, etc.)
- [ ] **Multi-Field Comparison**: Overlay 2-3 fields on same chart with color coding
- [ ] **Favorites & Recents**: Quick-access to frequently analyzed fields
- [ ] **Alternative Chart Types**: Bar chart, pie chart, stacked area views
- [ ] **Tier-Based Grouping**: Split chart by tier (similar to deaths radar)
- [ ] **Custom Aggregations**: User-defined formulas (e.g., "coins per wave")
- [ ] **Export Data**: Download chart data as CSV
- [ ] **Shareable URLs**: Persist field selection in URL query params

---

## Success Metrics

### Quantitative
- **Field Coverage**: 80+ numeric fields available for charting
- **Test Coverage**: ~100% for `.ts` logic files, ~100% for hook orchestration
- **Performance**: Page loads in <500ms with 1000+ runs
- **Code Reuse**: <200 new lines of code (excluding tests)

### Qualitative
- Users can discover and visualize fields without documentation
- Field selector UX feels intuitive and responsive
- Chart behavior consistent with coin/cell analytics pages
- Mobile experience maintains focus on chart (no sidebar distraction)

---

## Dependencies & Risks

### Dependencies
- **Existing Components**: `TimeSeriesChart`, `FieldSearch`, shadcn/ui `Select`
- **Data Layer**: `ParsedGameRun` interface, `DataProvider` context
- **Utilities**: `formatLargeNumber()`, `formatDuration()`, `fuzzyFilter()`

### Technical Risks

| Risk | Mitigation |
|------|------------|
| **Field name collisions** (cached vs. dynamic) | Prioritize cached properties, document precedence in `extractFieldValue()` |
| **Non-numeric field misclassification** | Filter by `dataType` strictly, add validation in `extractNumericFieldNames()` |
| **Performance with 80+ dropdown options** | Implement virtualized list if scroll lag observed (>100ms) |
| **Mobile dropdown UX issues** | Test on iOS/Android, consider modal picker for small screens |
| **Formatting inconsistencies across fields** | Create comprehensive formatter mapping in `getFieldFormatter()` |

### UX Risks

| Risk | Mitigation |
|------|------------|
| **Field names unclear to users** | Use descriptive labels via `formatFieldDisplayName()`, add tooltips with descriptions |
| **Too many fields overwhelming** | Implement search prominently, consider categorization in Phase 2 |
| **Sidebar idea rejected after implementation** | MVP uses dropdown in card header - no sidebar |

---

## Open Questions & Decisions

### Resolved Decisions

**✅ Field Selection UI: Dropdown vs. Sidebar vs. Multi-Column List**
- **Decision**: Searchable dropdown in card header
- **Rationale**:
  - Mobile-friendly (doesn't consume screen space)
  - Consistent with existing analytics pages
  - Search makes 80+ options manageable
  - Sidebar would conflict with existing navigation
  - Multi-column list (like tier trends) too verbose for always-visible UI

**✅ Default Field**
- **Decision**: `coinsEarned` (Coins Earned)
- **Rationale**: Most common use case, matches existing coin analytics page

**✅ Page Naming: "Field Analytics" vs. "Property Analytics" vs. "Custom Charts"**
- **Decision**: "Field Analytics"
- **Rationale**:
  - "Field" aligns with codebase terminology (`fields` Record in `ParsedGameRun`)
  - "Property" too generic, unclear connection to game data
  - "Custom Charts" implies more configurability than MVP provides

**✅ Chart Type**
- **Decision**: Reuse existing `TimeSeriesChart` (line chart)
- **Rationale**: Proven component, consistent UX, supports all time periods

**✅ Run Type Filtering**
- **Decision**: Include (default to "Farming Only")
- **Rationale**: Consistent with coin/cell pages, important for accurate trend analysis

### Open Questions (Not Blocking MVP)

**🤔 Field Descriptions/Tooltips**
- Should we add descriptive tooltips explaining what each field measures?
- **Recommendation**: Phase 2 - requires field metadata mapping

**🤔 Field Units Display**
- Should dropdown show units? (e.g., "Damage Dealt (hits)", "Real Time (seconds)")
- **Recommendation**: Phase 2 - requires unit metadata, minimal user value for MVP

**🤔 Multi-Field Selection**
- How to evolve UI when supporting multiple fields on one chart?
- **Recommendation**: Separate story - likely requires checkbox list or tag input

---

## Implementation Checklist

### Pre-Implementation
- [x] Explore existing `TimeSeriesChart` usage and architecture
- [x] Document available fields and data types
- [x] Identify reusable components (FieldSearch, Select)
- [ ] Review PRD with stakeholders

### Development (Main Agent)
- [ ] **Extract**: Generalize `TimeSeriesChart` props (`metric: string`)
- [ ] **Extract**: Create `extractFieldValue()` in `chart-data.ts`
- [ ] **Extract**: Create `prepareFieldPerRunData()` and `prepareFieldPerHourData()`
- [ ] **Extract**: Modify `prepareTimeSeriesData()` to route to generic functions
- [ ] **Create**: `field-discovery.ts` with `extractNumericFieldNames()`
- [ ] **Create**: `field-formatters.ts` with `formatFieldDisplayName()` and `getFieldFormatter()`
- [ ] **Create**: `field-selector.tsx` component with search
- [ ] **Create**: `use-field-selector.ts` hook
- [ ] **Create**: `/charts/fields.tsx` page route
- [ ] **Test**: Write unit tests for all `.ts` logic files (~100% coverage)
- [ ] **Test**: Write hook tests for `use-field-selector.tsx`
- [ ] **Test**: Write component tests for `field-selector.tsx`
- [ ] **Test**: Write integration test for page happy path
- [ ] **Verify**: Manual testing on desktop and mobile

### Review (Automated Workflow)
- [ ] **Stage 2**: Frontend Design Review Agent
  - Visual consistency with existing analytics pages
  - Gradient theme distinct and appealing
  - Responsive behavior on mobile
  - CSS organization and optimization
- [ ] **Stage 3**: Architecture Review Agent
  - Component decomposition and line limits
  - Logic-presentation separation compliance
  - File organization (feature-based, not type-based)
  - Performance optimizations (memoization, etc.)
  - Test coverage validation

### Documentation
- [ ] Update navigation to include "Field Analytics" link
- [ ] Add inline JSDoc comments for new utilities
- [ ] Update CHANGELOG with new feature

---

## Appendix

### Example Fields Available for Charting

**Cached Properties (Always Available):**
- `tier` - Current difficulty tier (1-21+)
- `wave` - Furthest wave reached
- `coinsEarned` - Total coins earned in run
- `cellsEarned` - Total cells earned in run
- `realTime` - Run duration in seconds

**Common Dynamic Fields (User-Imported):**
- `damage_dealt` - Total damage to enemies
- `damage_taken` - Total damage received
- `enemies_defeated` - Enemy kill count
- `shards_earned` - Shards (premium currency)
- `keys_collected` - Key items found
- `special_ability_uses` - Ability activation count
- `weapon_damage_<type>` - Damage by weapon category
- ... 70+ additional fields

**Field Data Types:**
- `number` - Numeric values (damage, counts, currencies)
- `duration` - Time spans in seconds (run time, wave duration)
- `string` - (Excluded from charting)
- `date` - (Excluded from charting)

### UI Mockup Reference

**Desktop View:**
```
┌──────────────────────────────────────────────────────────────┐
│                     📊 Field Analytics                        │
│     Analyze trends for any tracked metric. Select a field    │
│              to visualize performance over time.              │
└──────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────┐
│ Field: [Damage Dealt ▼         ]                   🔄 Refresh │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   Damage Dealt Over Time                                     │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐   │
│   │      Chart with period controls and filters         │   │
│   │      (Hourly/Run/Daily/Weekly/Monthly/Yearly)       │   │
│   │      (All/Farming/Tournament/Milestone)             │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Field Selector Dropdown (Expanded):**
```
┌──────────────────────────────────────┐
│ [Search fields...            ] 🔍    │
│ Showing 5 of 82 fields               │
├──────────────────────────────────────┤
│ ✓ Damage Dealt (number)              │  ← Selected
│   Damage Taken (number)              │
│   Damage by Fire (number)            │
│   Damage by Ice (number)             │
│   Damage by Lightning (number)       │
│   ...                                │
│   [Scroll for more]                  │
└──────────────────────────────────────┘
```

**Mobile View (375px width):**
```
┌────────────────────────────┐
│   📊 Field Analytics       │
│   Analyze any metric       │
├────────────────────────────┤
│ Field: [Damage ▼]          │
├────────────────────────────┤
│  Damage Dealt Over Time    │
│                            │
│  ┌───────────────────────┐│
│  │   Chart (compact)     ││
│  │   Period: Daily ▼     ││
│  │   Type: Farming ▼     ││
│  └───────────────────────┘│
└────────────────────────────┘
```

---

## Related Documents

- **Existing Analytics Pages**:
  - [Coins Analytics](src/routes/charts/coins.tsx)
  - [Cells Analytics](src/routes/charts/cells.tsx)
  - [Deaths Analysis](src/routes/charts/deaths.tsx)
  - [Tier Stats](src/routes/charts/tier-stats.tsx)
  - [Tier Trends](src/routes/charts/tier-trends.tsx)

- **Component Architecture**:
  - [TimeSeriesChart Component](src/features/analysis/time-series/time-series-chart.tsx)
  - [Chart Data Aggregation](src/features/analysis/time-series/chart-data.ts)
  - [Field Search Component](src/shared/domain/fields/field-search.tsx)
  - [Field Filter Hook](src/features/settings/column-config/use-field-filter.ts)

- **Data Types**:
  - [ParsedGameRun Interface](src/shared/types/game-run.types.ts)
  - [Chart Types](src/features/analysis/time-series/chart-types.ts)

---

**PRD Version:** 1.0
**Last Updated:** 2025-11-01
**Author:** Tower of Tracking Development Team
**Status:** Ready for Implementation
