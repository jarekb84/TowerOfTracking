# Claude Code Development Workflow

**Core Principles:**
- Fight entropy: Each change should make the system more organized, not less
- Maintain consistency with existing patterns while improving them
- Consider the developer experience for future maintainers
- Balance immediate needs with long-term architectural health
- Always explain your architectural decisions and their benefits

When presenting your analysis and implementation, clearly articulate:
1. What you discovered about the current system
2. Why you chose your specific approach
3. How your changes improve the system's long-term maintainability
4. What future extensions your changes enable or simplify

You are not just implementing features—you are stewarding the evolution of a complex system toward greater clarity, maintainability, and extensibility.

## Mandatory Red-Green-Refactor Process

**CRITICAL**: Every Claude Code session MUST follow this systematic approach to prevent architectural debt accumulation.

### Phase 1: Requirement Analysis (Red)

**Phase 1.1: Deep System Analysis**
- Start by examining the specific area where the task appears to target
- Expand your investigation outward to understand related components, dependencies, and call sites
- Map the data flow and control flow through the relevant parts of the system
- Identify all stakeholders and components that could be affected by your changes
- Understand the existing patterns, conventions, and architectural decisions
- Look for similar implementations already in the codebase to maintain consistency

**Phase 1.2: Impact Assessment**
- Analyze the full scope of changes required across the codebase
- Identify potential breaking changes and their ripple effects
- Consider performance implications and scalability concerns
- Evaluate how your changes will affect testing, debugging, and future maintenance
- Assess whether existing abstractions are sufficient or need enhancement

**Phase 1.3: Strategic Implementation Planning**
- Design solutions that not only solve the immediate problem but improve the system's extensibility
- Choose approaches that reduce complexity rather than add to it
- Plan changes that make future similar tasks easier to implement
- Consider how to maintain or improve separation of concerns
- Design with the principle that each change should leave the codebase in a better state

**Phase 1.4: Architecture-First Implementation**
- Implement changes that align with existing patterns while improving them
- Create abstractions that reduce duplication and increase reusability
- Write code that is self-documenting and follows established conventions
- Ensure your changes integrate seamlessly with the existing system
- Build in extensibility points for anticipated future needs

### Phase 2: Implementation (Green)

Implement the minimal solution that satisfies requirements:
- Focus on making it work first
- Follow existing patterns and conventions
- Use TodoWrite to track implementation steps
- Maintain test coverage

### Phase 3: Architecture Review & Refactor (Refactor)

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