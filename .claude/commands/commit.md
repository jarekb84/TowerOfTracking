---
description: Generate commit message and PR documentation for staged changes
---

You are being invoked via the `/commit` slash command to generate commit messages and PR documentation.

Invoke the `commit-pr-generator` agent to analyze the current git diff and staged changes, then generate:
1. A well-structured commit message following conventional commit format
2. A comprehensive PR title and description
3. Documentation optimized for both developer understanding and automated release notes

The commit-pr-generator agent will analyze:
- All staged changes in git
- The context of modified files
- Related code patterns and conventions
- Impact of changes on the codebase

After the agent completes, display its full output to the user without modification or summarization.
