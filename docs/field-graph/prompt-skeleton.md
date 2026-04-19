## Prompt skeleton — implementation chats

Copy-paste this into a new chat for each commit. Fill in the bracketed parts.

```
You are implementing commit [N] from docs/field-graph/EPIC-migration.md on branch 204-v28-migration-safety.

Read in this order before starting:
1. docs/field-graph/field-graph-for-ai.md — standing contributor guide.
2. docs/field-graph/EPIC-migration.md — epic checklist. Confirm commit [N] is TODO, confirm its dependencies are marked DONE, and read the commit's scope + spec references.
3. docs/field-graph/architecture/[NN-...md files listed in the commit's spec references] — authoritative spec. The full spec lives in docs/field-graph/architecture/, indexed at 00-table-of-contents.md; only load the per-section files referenced by this commit.

Scope for this commit (from the epic):
[PASTE the commit's Scope + DoD verbatim from the epic.]

Constraints:
- Stay strictly within scope. Anything you notice outside the DoD goes in "Notes & Findings" at the end of the epic — do not fix it here.
- Follow the React separation and code-org rules in CLAUDE.md.
- `npm run integration-precheck` must pass before the commit lands.
- If a prior commit's work turns out to be incomplete, STOP and flag it; do not silently fix it.
- Never mark the commit DONE in the epic yourself — tell me what you finished and I will update status after local verification.

Before reporting back:
1. Edit docs/field-graph/EPIC-migration.md — scroll to the "Notes & Findings" section near the bottom and APPEND entries for anything unexpected, deferred, or that later commits need to know about. Use the format `- [YYYY-MM-DD] [commit N] — <note>`. One bullet per observation. Do this in the epic file itself, not just in your report below.
2. Do NOT change the commit's status marker (`[ ]` → `[~]` or `[x]`). That's the human's call after local verification.

Then report back:
1. Summarize what changed (files added / modified / deleted, roughly).
2. Show me the commit message you suggest.
3. If you had to deviate from the spec, say where and why (this is in addition to the Notes & Findings entries in the epic — the report is for my eyes now; the epic is for future commits).
4. Tell me which Notes & Findings entries you just appended so I can sanity-check.
```

### Per-phase notes on this prompt

- **Phase 1 commits (1–3)**: lower risk; the agent is writing greenfield. Follow the skeleton as-is.
- **Phase 2 commits (4–14)**: each deletes imperative code. Add to the constraints: "Preserve existing public API shapes where reasonable. If a consumer becomes a one-line call into the graph, fine — but do not change the call sites' own contract."
- **Commit 15**: the real feature. Add to the scope: "After declaring the edges, run the parser against each Dissonance_*.txt sample in `sampleData/v28/` and show me the resulting `ParsedGameRun.fields._dissonanceSubCategory` values."

## Status audit — last updated

_(update this line each time you mark a commit DONE.)_

- Last updated: 2026-04-19
- Commits DONE: 0 / 15
- Currently in progress: none
