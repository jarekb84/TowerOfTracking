# React Architecture: Logic-Presentation Separation

## Core Separation Doctrine

**CRITICAL**: React `.tsx` components must be ultra-thin—DOM markup only. Extract ALL business logic, data transforms, and complex handlers into pure functions and custom hooks.

### File Role Definitions

#### Presentation Layer (`*.tsx`)
- **DOM/JSX markup ONLY**
- Event handlers are one-liners delegating to hook callbacks
- NO business logic, validation, transforms, or complex branching
- May import: same-feature hooks (`use*.ts`), types, tiny presentational helpers
- **Hard limit: 200 lines** (if exceeded, extract sub-components)

#### Orchestration Layer (`use*.ts`)  
- React state/effects/context wiring and service coordination
- Delegate all transforms/validation/calculation to pure functions
- NO JSX (React imports allowed for hooks/effects)
- Handle React-specific needs: state management, side effects, context consumption

#### Logic Layer (`*.ts`)
- **Pure, deterministic functions**: transforms, validation, calculation, mapping, parsing
- **MUST NOT** import React or testing libraries
- Small, composable, fully testable
- Single responsibility per function

### Import Flow (Within Feature)
```
*.tsx → use*.ts → *.ts (pure functions)
```

## Architecture Boundaries

### Feature Organization
- **Feature-first**: `src/features/<Feature>/...`
- **Capability subfolders** (only when needed): `src/features/<Feature>/<Capability>/...`
- **FORBIDDEN**: Type-based dirs (`components/`, `hooks/`, `logic/`, `types/`)

### Shared Code
- Extract truly reusable logic to `src/shared/<Domain>/...`
- Maintain feature-oriented structure (not type-oriented)

## Code Generation Rules (AI MUST Follow)

### When Adding Logic to Components
1. **STOP** - do not add logic inline
2. Extract to hook (for React needs) or pure function (for transforms/validation)
3. Generate unit tests for new logic
4. Keep component as thin wrapper calling hook methods

### New Hook Requirements
- Generate unit tests for orchestration paths
- Mock effects/services as needed
- Test state transitions and error handling

### New Pure Function Requirements  
- Generate unit tests covering all branches and edge cases
- Test with realistic data from the domain
- Aim for ~100% coverage (lines/branches/statements)

### Page/Integration Tests
- **Minimal**: One happy-path test per page
- Verify core flow loads and basic functionality works
- Do NOT test every filter/variant combination

## Boy-Scout Migration Rules

**MANDATORY**: When touching mixed-concern components, extract at least one logical slice:

### Migration Checklist
- [ ] Identify at least one logic cluster in `.tsx`
- [ ] Extract to pure function (`*.ts`) or hook (`use*.ts`)
- [ ] Replace inline logic with function calls  
- [ ] Add unit tests for extracted logic
- [ ] Keep/adjust single page happy-path test

### Examples of Logic to Extract
- Data transformations (sorting, filtering, formatting)
- Validation functions
- Complex event handlers with multi-step logic
- Calculations and derived values
- State update logic with branching

## Hard Anti-Patterns (FAIL PR)

### In Components (*.tsx)
- ❌ Inline data transforms: `data.map(item => transform(item))`
- ❌ Multi-step branching handlers
- ❌ Direct API calls or async operations
- ❌ Complex state derivation logic
- ❌ Business rule validation

### In General
- ❌ Adding features without unit tests for logic
- ❌ Page tests validating every UI variant
- ❌ Mixing React imports in pure function files
- ❌ Complex components over 200 lines

## Testing Strategy

### Coverage Requirements
- **~100% coverage** for `.ts` files (logic functions)
- **~100% coverage** for hook orchestration code (`use*.ts`)
- **One happy-path** integration test per page

### Testing Approach
- **Unit tests**: All business logic, transformations, validations
- **Hook tests**: State management, effect orchestration, service integration
- **Integration tests**: Core user flows, not exhaustive UI combinations

## Enforcement in Code Reviews

### Required Checks
1. No business logic in `.tsx` files
2. All new logic has corresponding unit tests
3. Components under 200 lines
4. Proper import flow: tsx → hooks → pure functions
5. Cross-feature imports only through public APIs

### Automatic Failures  
- Logic-heavy components without extraction
- Missing tests for new business logic
- Direct cross-feature deep imports
- React imports in pure function files

## Migration Timeline

**Continuous**: Apply boy-scout rule on every component touch
**Target**: All critical paths follow separation within 3 months
**Measurement**: Track logic-to-presentation ratio in components during PR reviews