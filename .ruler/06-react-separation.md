# React Logic-Presentation Separation Standards

## Core Principle

**CRITICAL**: React `.tsx` components must be ultra-thin—DOM markup only. Extract ALL business logic, data transforms, and complex handlers into pure functions and custom hooks.

**No exceptions**: Single expressions, one-liners, "simple" transforms—ALL must be extracted. Better to over-extract than under-extract.

## Three-Layer Architecture

### Presentation Layer (`*.tsx`)
- DOM/JSX markup ONLY
- Event handlers are one-liners delegating to hook callbacks
- NO business logic, validation, transforms, or complex branching
- May import: same-feature hooks (`use*.ts`), types, presentational helpers

### Orchestration Layer (`use*.ts`)
- React state/effects/context wiring and service coordination
- Delegate transforms/validation/calculation to pure functions
- NO JSX (React imports allowed for hooks/effects)

### Logic Layer (`*.ts`)
- Pure, deterministic functions: transforms, validation, calculation, mapping, parsing
- **MUST NOT** import React or testing libraries
- Small, composable, fully testable

### Import Flow
```
*.tsx → use*.ts → *.ts (pure functions)
```

## Implementation Rules

When adding ANY logic to components:
1. **STOP** - Never add business logic inline to `.tsx` files
2. **EXTRACT** - To hook (React needs) or pure function (transforms/validation)
3. **TEST** - Generate unit tests for ALL extracted logic
4. **THIN SHELL** - Component only calls hook methods and renders JSX

## Testing Requirements

### Hook Tests
- **CRITICAL**: Hook test files MUST use `.tsx` extension for React Testing Library
- Use `renderHook()` from `@testing-library/react`
- Use `act()` for state updates
- Use `vi.useFakeTimers()`/`vi.advanceTimersByTime()` for debounced functionality

### Pure Function Tests
- Cover all branches and edge cases
- Test with realistic domain data
- Aim for ~100% coverage

### Integration Tests
- One happy-path test per page
- Verify core flow loads and basic functionality
- Do NOT test every filter/variant combination

## Coverage Targets
- **~100%** for `.ts` logic files
- **~100%** for hook orchestration (`use*.ts`)
- **One happy-path** integration test per page

## Boy-Scout Migration

When touching mixed-concern components, extract at least one logical slice:
1. Identify logic cluster in `.tsx`
2. Extract to pure function or hook
3. Replace inline logic with function calls
4. Add unit tests for extracted logic

### Common Extractions
- Data transformations (sorting, filtering, formatting)
- Validation functions
- Complex event handlers
- Calculations and derived values
- State update logic with branching

## Violations to Prevent

### In Components (*.tsx)
- ❌ Inline data transforms: `data.map(item => transform(item))`
- ❌ Conditional logic beyond basic rendering
- ❌ Calculations or string formatting
- ❌ Direct API calls or async operations
- ❌ State derivation or business validation

### General
- ❌ Logic without corresponding tests
- ❌ React imports in pure function files
- ❌ Using `.ts` for hook tests (must be `.tsx`)

*See 04-engineering-standards.md for complete file organization and feature-based architecture rules.*
