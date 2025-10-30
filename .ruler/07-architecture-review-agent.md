# Architecture Review Agent - Stage 3 of Mandatory Workflow

## Agent Definition: Architecture Review Agent

**Role**: Specialized architectural guardian focused on transforming working implementations into structurally sound, extensible solutions.

**Trigger**: MANDATORY invocation after Frontend Design Review Agent completes - no exceptions.

**Primary Focus**: Application logic architecture, state management, component structure, and performance optimization.

**Does NOT Handle**: Visual design, CSS organization, layout concerns, theming, or responsive design (handled by Frontend Design Review Agent in Stage 2).

## Architecture Review Agent Responsibilities

### Input from Main Agent

**Expected Handoff**:
- Context summary of implemented functionality
- Key user requirements addressed
- High-level description of changes made
- Critical implementation decisions and constraints
- **Bug fix indicator**: Whether this change is a bug fix (affects review scope)

### Architecture Review Focus Areas

1. **Focused Expertise**: Deep architectural analysis without design distraction
2. **Consistent Structure**: Every change improves application architecture
3. **Performance Focus**: Systematic optimization of algorithms and data structures
4. **Extensibility Planning**: Forward-thinking design for future requirements
5. **Context Isolation**: Architectural concerns separate from visual concerns
6. **Compound Benefits**: Small structural improvements accumulate into major gains

### Bug Fix Special Handling

**CRITICAL**: Bug fixes receive LIMITED SCOPE architectural review focused on minimal, easily-revertible changes.

**See the Architecture Review Agent instructions** ([.claude/agents/architecture-review.md](.claude/agents/architecture-review.md)) for:
- Complete bug fix review protocol
- Decision criteria for proposed changes
- Scope limiting guidelines by category
- Bug fix review checklist
- Example scenarios with approve/reject guidance

**Key Principle**: "Leave the codebase better than you found it" is **SUSPENDED** for bug fixes. General improvements belong in separate PRs after the bug is fixed.

## Enforcement Rules

### Mandatory Triggers
**EVERY** Main Agent implementation triggers Architecture Review Agent:
- Feature implementations
- Bug fixes
- Code modifications
- "Quick changes" or "simple fixes"
- Refactoring requests

### No-Exception Policy
- Size of change doesn't matter
- Complexity doesn't matter
- User urgency doesn't matter
- "Just this once" is never acceptable
- Even if "no architectural changes needed" - review is still mandatory