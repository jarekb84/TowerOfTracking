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

## Bug Fix Detection

**Identifying Bug Fixes:**
Determine if the change is a bug fix by examining:
- User request contains keywords: "fix", "bug", "issue", "error", "broken", "not working"
- Branch name contains: "fix", "bug", "issue", "hotfix"
- Change addresses unintended behavior or incorrect functionality
- Change corrects a defect rather than adding new capability

**Bug Fix vs Feature:**
- **Bug Fix**: Corrects unintended behavior, restores expected functionality, fixes errors
- **Feature**: Adds new capability, enhances existing functionality with new behavior
- **When Unclear**: Ask the user to clarify if this is fixing a bug or adding/enhancing functionality

## Mandatory Red-Green-Refactor Process

**CRITICAL**: EVERY SINGLE CHANGE, regardless of perceived complexity or size, MUST follow this complete systematic approach to prevent architectural debt accumulation.

**NO EXCEPTIONS**: "Simple" requests, one-line changes, quick fixes, and small features ALL require the full Red-Green-Refactor process. Every prompt is an opportunity for architectural improvement.

**ARCHITECTURAL STEWARDSHIP FIRST**: You are not just implementing features—you are stewarding the evolution of the system. Every change must improve the codebase's structure, not just solve the immediate problem.

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
- **MANDATORY**: Evaluate file organization and apply progressive directory creation triggers

### Phase 2: Implementation (Green)

Implement the minimal solution that satisfies requirements:
- Focus on making it work first
- Follow existing patterns and conventions
- **MANDATORY**: Apply React separation doctrine—ZERO logic in `.tsx` files
- **MANDATORY**: Generate unit tests for ALL new logic (`.ts`) and hook orchestration (`use*.ts`)
- **MANDATORY**: Extract logic from components into hooks or pure functions, even for "simple" changes
- Use TodoWrite to track implementation steps
- Maintain test coverage
- **BOY-SCOUT RULE**: When touching any file, extract at least one logic chunk with tests
- **FILE ORGANIZATION BOY-SCOUT RULE**: When touching files, apply incremental reorganization:

  - Move related hook + logic + types together with the component
  - Update imports in the same PR
  - Create subdirectories for sub-features when 3+ related files exist
  - DON'T reorganize unrelated files

**BUG FIX SPECIFIC RULES**:
- **SUSPEND** Boy-Scout Rule for bug fixes - only change code directly related to the fix
- **LIMIT SCOPE**: Changes should be minimal and focused on fixing the specific issue
- **NO UNRELATED IMPROVEMENTS**: Defer general improvements, file reorganization, and pattern updates
- **ISOLATE FIX**: Extract bug fix logic into separate function/hook/component if it helps clarity

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

**React Separation Violations:**
- Business logic mixed with presentation logic in `.tsx` files
- Components over 200 lines without extraction
- Missing abstraction layers (hooks, pure functions)
- Logic directly in event handlers instead of hook callbacks
- Pure functions importing React or testing libraries
- Cross-feature imports bypassing public APIs


## Mandatory Orchestration Protocol

**CRITICAL**: The Main Agent acts as the **orchestrator** for all review agents. Specialized agents do NOT call other agents - they complete their work and return control to the Main Agent orchestrator.

### Main Agent Orchestration Flow

**Step 1: Implementation**
- Main Agent implements the user's requested changes
- Applies all implementation standards (React separation, testing, etc.)
- Prepares context for review agents

**Step 2: Frontend Design Review** (for non-bug-fix changes)
- Main Agent invokes Frontend Design Review Agent
- Frontend Design Review Agent completes and returns results
- Main Agent receives design improvements

**Step 3: E2E Test Review** (conditional)
- Main Agent checks git diff for E2E file changes:
  ```bash
  git diff --name-only | grep -E 'e2e/.*\.(test|spec)\.ts$|e2e/page-objects/.*\.ts$'
  ```
- **IF E2E files were modified**: Main Agent invokes E2E Test Architect Agent
- E2E Test Architect Agent completes and returns results
- Main Agent receives E2E test improvements

**Step 4: Architecture Review** (always)
- Main Agent invokes Architecture Review Agent (with bug fix context if applicable)
- Architecture Review Agent completes and returns results
- Main Agent receives architectural improvements

**Step 5: Code Organization & Naming Review** (always)
- Main Agent invokes Code Organization & Naming Agent (with bug fix context if applicable)
- Code Organization & Naming Agent completes and returns results
- Main Agent receives organization and naming improvements

**Step 6: Final Summary**
- Main Agent provides comprehensive summary to user
- Includes improvements from all invoked agents

### Orchestration Templates

**FOR BUG FIXES:**
```
[Main Agent implements bug fix]

"I have completed the bug fix implementation. Skipping Frontend Design Review Agent per bug fix protocol. Now invoking the Architecture Review Agent with bug fix context for focused architectural review."

[Architecture Review Agent returns]

"Architecture review complete. Now invoking the Code Organization & Naming Agent with bug fix context for limited scope organizational review."

[Code Organization & Naming Agent returns]

"All reviews complete. Here's the summary of improvements..."
```

**FOR FEATURES (without E2E changes):**
```
[Main Agent implements feature]

"I have completed the initial implementation. Now invoking the Frontend Design Review Agent for mandatory visual and CSS review."

[Frontend Design Review Agent returns]

"Design review complete. No E2E test files detected. Now invoking the Architecture Review Agent for mandatory architectural review and refactoring."

[Architecture Review Agent returns]

"Architecture review complete. Now invoking the Code Organization & Naming Agent for final organizational polish."

[Code Organization & Naming Agent returns]

"All reviews complete. Here's the summary of improvements..."
```

**FOR FEATURES (with E2E changes):**
```
[Main Agent implements feature]

"I have completed the initial implementation. Now invoking the Frontend Design Review Agent for mandatory visual and CSS review."

[Frontend Design Review Agent returns]

"Design review complete. E2E test files detected in git diff. Now invoking the E2E Test Architect Agent for mandatory E2E test review."

[E2E Test Architect Agent returns]

"E2E test review complete. Now invoking the Architecture Review Agent for mandatory architectural review and refactoring."

[Architecture Review Agent returns]

"Architecture review complete. Now invoking the Code Organization & Naming Agent for final organizational polish."

[Code Organization & Naming Agent returns]

"All reviews complete. Here's the summary of improvements..."
```

### Agent Completion Protocol

**Specialized agents MUST:**
- Complete their specific domain review
- Return a summary of improvements made
- **NOT** invoke other agents
- **NOT** reference what happens next in the workflow

**Main Agent orchestrator MUST:**
- Decide which agents to invoke based on change type and modified files
- Provide context to each agent about the changes
- Collect results from each agent
- Provide final comprehensive summary to user

## Size-Agnostic Enforcement Rules

**EVERY CHANGE MUST:**

1. **Follow complete 3-agent process** - no shortcuts for "simple" requests
2. **Complete each stage fully** - no skipping or combining agents
3. **Generate proper handoff summaries** - context for next agent
4. **Apply all quality standards** - every stage has mandatory requirements

**FORBIDDEN SHORTCUTS:**

- ❌ "This is simple, skip architecture review"
- ❌ "No visual changes, skip design review"
- ❌ "Quick fix doesn't need full workflow"
- ❌ "Urgent request, streamline process"

**NO EXCEPTIONS POLICY:**

- Size doesn't matter
- Complexity doesn't matter
- User urgency doesn't matter
- "Just this once" is never acceptable

Every change improves the codebase through systematic, specialized review.