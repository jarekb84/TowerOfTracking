# React Architecture: Logic-Presentation Separation

## ABSOLUTE ZERO TOLERANCE POLICY

**CRITICAL MANDATE**: React `.tsx` components must be ultra-thin—DOM markup only. Extract ALL business logic, data transforms, and complex handlers into pure functions and custom hooks.

**NO SIZE EXCEPTIONS**: Single expressions, one-liners, "simple" transforms, basic calculations—ALL must be extracted. Size does not matter. Complexity does not matter. Every piece of business logic lives outside `.tsx` files.

**MANDATORY TESTING**: Every extracted logic piece, no matter how trivial, requires comprehensive unit tests. No exceptions.

## Core Separation Doctrine

**ENFORCEMENT PRIORITY**: Logic-presentation separation takes precedence over user convenience. Better to over-extract than under-extract.

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

### ZERO TOLERANCE: When Adding Logic to Components
1. **IMMEDIATE STOP** - NEVER add ANY business logic inline to `.tsx` files
2. **MANDATORY EXTRACTION** - Extract to hook (for React needs) or pure function (for transforms/validation)
3. **NO EXCEPTIONS** - Even single-line business logic, simple transforms, and "quick fixes" MUST be extracted
4. **MANDATORY TESTS** - Generate comprehensive unit tests for ALL extracted logic
5. **COMPONENT AS SHELL** - Keep component as ultra-thin wrapper calling hook methods only

### SIZE-AGNOSTIC ENFORCEMENT
**ALL LOGIC EXTRACTIONS, regardless of size:**
- Single conditional expressions → extract to pure function
- Simple data transformations → extract to pure function  
- Basic validations → extract to pure function
- Any calculation → extract to pure function
- Event handler with business logic → extract to hook method

### New Hook Requirements
- **CRITICAL**: Hook test files MUST use `.tsx` extension (not `.ts`) for React Testing Library compatibility
- Generate unit tests for orchestration paths using `renderHook()` from `@testing-library/react`
- Use `act()` for state updates, `vi.useFakeTimers()`/`vi.advanceTimersByTime()` for debounced functionality
- Mock effects/services as needed
- Test state transitions and error handling
- Test consumer-focused behavior, not implementation details
- Use realistic mock data matching actual TypeScript interfaces

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

## Hard Anti-Patterns (IMMEDIATE SESSION TERMINATION)

### In Components (*.tsx)
- ❌ **ANY** inline data transforms: `data.map(item => transform(item))`
- ❌ **ANY** conditional logic beyond basic rendering decisions
- ❌ **ANY** calculations, even simple math operations
- ❌ **ANY** string formatting or data manipulation
- ❌ Multi-step branching handlers
- ❌ Direct API calls or async operations
- ❌ **ANY** state derivation logic
- ❌ **ANY** business rule validation
- ❌ **ANY** form validation logic

### In General (SESSION FAILURES)
- ❌ Adding **ANY** logic without extracting and testing
- ❌ Justifying inline logic as "too simple to extract"
- ❌ Page tests validating every UI variant
- ❌ Mixing React imports in pure function files
- ❌ Components over 200 lines
- ❌ Skipping Red-Green-Refactor process for "small" changes
- ❌ Using `.ts` extension for hook tests (MUST be `.tsx` for React Testing Library)

## Testing Strategy

### Coverage Requirements
- **~100% coverage** for `.ts` files (logic functions)
- **~100% coverage** for hook orchestration code (`use*.ts`)
- **One happy-path** integration test per page

### Testing Approach
- **Unit tests**: All business logic, transformations, validations (`.ts` files)
- **Hook tests**: State management, effect orchestration, service integration (`.tsx` files with `renderHook()`)
- **Integration tests**: Core user flows, not exhaustive UI combinations

## Enforcement in Code Reviews

### Required Checks
1. No business logic in `.tsx` files
2. All new logic has corresponding unit tests
3. Components under 200 lines
4. Proper import flow: tsx → hooks → pure functions
5. Cross-feature imports only through public APIs

### Automatic Session Termination
- **ANY** business logic added to `.tsx` files, regardless of size
- **ANY** logic extraction without corresponding unit tests
- Missing tests for **ANY** new business logic
- Direct cross-feature deep imports
- React imports in pure function files
- Justifying shortcuts with "this is just a simple change"
- Skipping architectural review for **ANY** change

## Migration Timeline

**Continuous**: Apply boy-scout rule on every component touch
**Target**: All critical paths follow separation within 3 months
**Measurement**: Track logic-to-presentation ratio in components during PR reviews