# Engineering Standards & Code Architecture Guidelines

## File Organization & Structure

**Feature-Based Architecture**: Organize code by business features, not file types. Group related components, types, styles, and utilities together.

**File Size Limits**: Keep files focused and maintainable
- **Maximum 300 lines per file** - decompose when approaching this limit
- Apply **Single Responsibility Principle** - each file should have one primary reason to change
- **Composition over complexity** - break down complex components into smaller, focused pieces

**Co-location**: Keep related code together. If components, types, and utilities are tightly coupled to a specific feature, place them in the same feature directory.

## TypeScript Standards

**Type Organization**:
- Use descriptive interface/type names with clear business domain language

## Component Architecture & React Separation

**CRITICAL**: Enforce strict logic-presentation separation in all React code.

**Component Layer (*.tsx)**:
- **Ultra-thin**: DOM/JSX markup ONLY
- Event handlers must be one-liners delegating to hook callbacks
- **Hard limit: 200 lines** - extract sub-components when exceeded
- NO business logic, validation, transforms, or complex branching
- Import only: same-feature hooks (`use*.ts`), types, presentational helpers

**Hook Layer (use*.ts)**:
- React state/effects/context orchestration
- Delegate transforms/validation/calculation to pure functions (`*.ts`)
- Handle React-specific needs: state, effects, context consumption
- NO JSX (React imports allowed for hooks/effects)
- **CRITICAL**: Hook tests MUST use `.tsx` extension for React Testing Library compatibility

**Logic Layer (*.ts)**:
- Pure, deterministic functions: transforms, validation, calculation, mapping, parsing
- Small, composable, fully unit-tested functions
- **MUST NOT** import React or testing libraries
- Single responsibility per function

**Import Flow**: `*.tsx → use*.ts → *.ts` (within feature)

**Testing Requirements**:
- **~100% coverage** for all `.ts` logic files
- **~100% coverage** for hook orchestration code (`use*.test.tsx` files)
- **One happy-path** integration test per page (not exhaustive UI variants)
- **React Hook Testing**: Use `renderHook()` from `@testing-library/react`, `act()` for state updates
- **Realistic Mock Data**: Test with data matching actual TypeScript interfaces

**Boy-Scout Rule**: When touching any mixed-concern component, extract at least one logic chunk into hooks or pure functions with tests.