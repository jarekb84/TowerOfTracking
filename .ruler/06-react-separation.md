# React Logic-Presentation Separation

## Core Principle

React `.tsx` components must be ultra-thin—DOM markup only. Extract ALL business logic, data transforms, and complex handlers into pure functions and custom hooks.

**No exceptions**: Single expressions, one-liners, "simple" transforms—ALL must be extracted.

## Three-Layer Architecture

### Presentation Layer (`*.tsx`)
- DOM/JSX markup ONLY
- Event handlers are one-liners delegating to hook callbacks
- NO business logic, validation, transforms, or complex branching

### Orchestration Layer (`use*.ts`)
- React state/effects/context wiring
- Delegate transforms/validation/calculation to pure functions
- NO JSX

### Logic Layer (`*.ts`)
- Pure, deterministic functions
- **MUST NOT** import React or testing libraries
- Fully testable

### Import Flow
```
*.tsx → use*.ts → *.ts (pure functions)
```

## Implementation Rules

1. **STOP** - Never add business logic inline to `.tsx` files
2. **EXTRACT** - To hook (React needs) or pure function (transforms)
3. **TEST** - Generate unit tests for ALL extracted logic
4. **THIN SHELL** - Component only calls hook methods and renders JSX

## Testing Requirements

**Hook Tests:**
- MUST use `.tsx` extension for React Testing Library
- Use `renderHook()` from `@testing-library/react`
- Use `act()` for state updates

**Pure Function Tests:**
- Cover all branches and edge cases
- Aim for ~100% coverage

**Coverage Targets:**
- ~100% for `.ts` logic files
- ~100% for hook orchestration (`use*.ts`)
- One happy-path integration test per page

## Violations to Prevent

In Components (*.tsx):
- Inline data transforms: `data.map(item => transform(item))`
- Conditional logic beyond basic rendering
- Calculations or string formatting
- Direct API calls or async operations

General:
- Logic without corresponding tests
- React imports in pure function files
- Using `.ts` for hook tests (must be `.tsx`)
