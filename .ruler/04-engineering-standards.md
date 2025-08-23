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

## Component Architecture

**Decomposition Strategy**:
- When a component grows beyond 200 lines, look for extraction opportunities
- Extract logical sections into sub-components
- Create feature sub-directories when 3+ closely related components emerge
- Prefer hooks for stateful logic extraction

**Independence & Low Coupling**:
- Minimize prop drilling with appropriate context boundaries
- Design components to be easily testable in isolation