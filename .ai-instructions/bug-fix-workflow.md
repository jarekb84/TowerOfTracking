# Bug Fix Workflow

**IMPORTANT**: Load these instructions when working on a bug fix. Bug fixes have different rules than feature work.

## Identifying a Bug Fix

**Ask yourself:**
1. Is this **restoring expected behavior** that previously worked, or **adding new capability**?
2. Does the change **correct a defect** (something that shouldn't happen) or **extend functionality**?
3. Would users describe this as "it's broken" vs "I wish it could do X"?

**Bug Fix Indicators:**
- Restoring functionality that was working before
- Correcting behavior that doesn't match documented/expected behavior
- Fixing crashes, errors, or data corruption
- Addressing user-reported problems with existing features

**When Unclear**: Ask the user to clarify: "Is this fixing something that's broken, or adding/enhancing functionality?"

## Bug Fix Specific Rules

### Scope Limitations

- **SUSPEND** Boy-Scout Rule - only change code directly related to the fix
- **LIMIT SCOPE**: Changes should be minimal and focused on fixing the specific issue
- **NO UNRELATED IMPROVEMENTS**: Defer general improvements, file reorganization, and pattern updates to separate PRs
- **ISOLATE FIX**: Extract bug fix logic into separate function/hook/component if it helps clarity

### Agent Orchestration for Bug Fixes

Bug fixes skip the Frontend Design Review Agent:

```
[Main Agent implements bug fix]

"I have completed the bug fix implementation. Skipping Frontend Design Review Agent per bug fix protocol. Now invoking the Architecture Review Agent with bug fix context for focused architectural review."

[Architecture Review Agent returns]

"Architecture review complete. Now invoking the Code Organization & Naming Agent with bug fix context for limited scope organizational review."

[Code Organization & Naming Agent returns]

"All reviews complete. Here's the summary of improvements..."
```

### Testing Requirements

- Add regression test to prevent the bug from recurring
- Keep test focused on the specific bug scenario
- Don't expand test coverage beyond the bug fix scope

### Commit Message Format

Bug fix commits should clearly indicate:
- What was broken
- What caused it
- How it was fixed

Example:
```
BUG: Fix date parsing failing for German locale

battleDate field was not parsing "20. Nov. 2025" format correctly
because the regex didn't account for day-first ordering.

Added day-first pattern matching to parseBattleDate().
```
