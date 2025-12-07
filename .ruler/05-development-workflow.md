# Development Workflow

## Scenario-Specific Instructions

**Load additional instructions when working on specific scenarios:**

| Scenario | Instruction File |
|----------|-----------------|
| Bug fixes | `.ai-instructions/bug-fix-workflow.md` |
| E2E tests | `.ai-instructions/e2e-testing.md` |

## Core Principles

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

## Phase 1: Requirements Analysis (CRITICAL)

**Every change requires deep understanding before implementation.** Avoid "AI slop"—changes that look like 15 different developers with 15 different patterns. Each change must fit the system cohesively.

### Deep System Analysis

- Start by examining the specific area where the task targets
- **Peel back the onion**: Don't stop at the files you'll modify—look 2-3 layers up
  - Find files that call the code you're changing
  - Find files that call *those* files
  - Understand how your change will ripple through the system
- Map the data flow and control flow through the relevant parts
- Look for similar implementations already in the codebase to maintain consistency

### Impact Assessment

- Analyze the full scope of changes required across the codebase
- Identify potential breaking changes and their ripple effects to consumers
- Evaluate how your changes will affect testing, debugging, and future maintenance
- Assess whether existing abstractions are sufficient or need enhancement
- **Ask**: Will this change make future modifications easier or harder?

### Strategic Implementation Planning

- Design solutions that not only solve the immediate problem but improve extensibility
- Choose approaches that reduce complexity rather than add to it
- Consider trade-offs between possible approaches—pick the one that improves the system long-term
- Plan changes that make future similar tasks easier to implement
- **Goal**: Each change should leave the codebase in a better state, not create one-off patterns

## Phase 2: Implementation

Implement the minimal solution that satisfies requirements:
- Focus on making it work first
- Follow existing patterns and conventions
- **MANDATORY**: Apply React separation—ZERO business logic in `.tsx` files
- **MANDATORY**: Generate unit tests for ALL new logic
- Use TodoWrite to track implementation steps

**Boy-Scout Rule**: When touching any file, extract at least one logic chunk with tests (suspended for bug fixes—see bug fix workflow).

## Phase 3: Review Agents

After implementation, the main agent orchestrates review agents. See Mandatory Orchestration Protocol below.

---

## Mandatory Orchestration Protocol

**CRITICAL**: The Main Agent acts as the **orchestrator** for all review agents. This protocol exists because each agent enforces specific architectural patterns and practices that keep the codebase extensible over time.

### Why This Matters

Each review agent has hundreds of lines of specialized instructions about patterns the architect cares deeply about. Their purpose is to take what the main agent built and apply these design standards to the git diff. This is what prevents "AI slop" and maintains a cohesive, extensible codebase.

**Specialized agents do NOT call other agents**—they complete their work and return control to the Main Agent orchestrator.

### Main Agent Orchestration Flow

**Step 1: Implementation**
- Main Agent implements the user's requested changes
- Applies all implementation standards (React separation, testing, etc.)

**Step 2: Frontend Design Review** (features only, skipped for bug fixes)
- Invokes Frontend Design Review Agent
- Agent reviews and implements CSS, visual consistency, layout, and responsive design improvements

**Step 3: E2E Test Review** (conditional—only if E2E files modified)
- Invokes E2E Test Architect Agent
- Agent reviews Page Object Model patterns, test organization, and E2E best practices

**Step 4: Architecture Review** (ALWAYS required)
- Invokes Architecture Review Agent
- Agent reviews component decomposition, abstraction design, performance patterns, and extensibility

**Step 5: Code Organization & Naming Review** (ALWAYS required)
- Invokes Code Organization & Naming Agent
- Agent reviews file organization, naming clarity, and feature-based structure

**Step 6: Final Summary**
- Main Agent provides comprehensive summary to user including improvements from all agents

### Orchestration Rules

**ALL agents must run** unless explicitly excepted:
- Bug fixes skip Frontend Design Review (see bug fix workflow)
- E2E Test Architect only runs when E2E files are modified

**NO SHORTCUTS**:
- Size doesn't matter—small changes still run all agents
- Complexity doesn't matter—"simple" changes still run all agents
- Urgency doesn't matter—the process is non-negotiable

Every change improves the codebase through systematic, specialized review.
