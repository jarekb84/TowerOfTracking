---
description: Generate Discord release notes from git commits since a version tag
---

You are being invoked via the `/release-notes <version>` slash command to generate Discord-friendly release notes.

**Expected usage**: `/release-notes v0.2.1` (or just `0.2.1`)

## Instructions

1. Parse the version parameter from the command (remove 'v' prefix if present)
2. Verify the git tag exists: `git tag -l "v${version}"`
3. If tag doesn't exist, ask user to provide a valid version tag
4. Invoke the `release-notes-generator` agent with:
   - Last version tag (e.g., "v0.2.1")
   - Any additional user context from the current conversation
5. Display the agent's complete output to the user

## Example Invocations

```
/release-notes v0.2.1
/release-notes 0.2.1
```

The agent will analyze all commits since the specified version and generate a Discord-ready post highlighting major features, improvements, and bug fixes.
