> **Date:** 2026-04-25
> **Branch:** 204-v28-migration-safety
> **Status:** Open — awaiting human decision (process / tooling concern, not a code commit)
> **Related:**
> - `.claude/agents/` — existing agents (architecture-review, pattern-drift-analyzer, code-organization-naming, localization-enforcer)
> - [`Notes-and-findings.md`](./Notes-and-findings.md) — commit 5 entries identifying the "review-process gap" (agents approve commits without flagging trajectory smells)
> - [`prompt-skeleton.md`](./prompt-skeleton.md) — current self-check protocol baked into per-commit prompts

# Architecture-enforcer agent — bridging review agents to field-graph rules

## Recommendation summary (30-second read)

The field-graph migration is generating a growing body of architectural rules — the cutover principle, the conditional-logic-elimination check, "consumers don't reason about renames," "no procedural transforms in the resolver," catalog-`PATTERN.md`'s four-question litmus, the "two-way breadcrumbs" discipline, and so on. These rules live in **`prompt-skeleton.md`**, **`field-graph-for-ai.md`**, **`catalog/edges/PATTERN.md`**, and **scattered Notes-and-findings entries**. Today they're enforced by the implementing AI's self-check + the existing review agents (pattern-drift, architecture, code-org). Per the [commit 5 review-process-gap finding](./Notes-and-findings.md), those agents are tuned for per-commit pattern adherence, not for trajectory smells across the epic.

**Recommended direction: a dedicated `field-graph-enforcer` agent invoked late in every commit's review chain**, scoped to:

1. Audit the diff against the field-graph rule set codified in `field-graph-for-ai.md` + `catalog/edges/PATTERN.md` + `catalog/PATTERN.md` + the cutover/conditional-logic checks from `prompt-skeleton.md`.
2. Surface trajectory concerns that single-commit agents miss: cumulative API surface growth, dead code drained, two-way breadcrumb compliance, exploration-doc references in Human decision sections.
3. Be **specific to the field-graph epic** — not a general-purpose architecture review. The existing `architecture-review` agent stays for everything else; the enforcer agent is narrowly the field-graph rule keeper.
4. Run as the **last review step** in the per-commit chain, AFTER pattern-drift / architecture / code-org / localization / local-storage-safety, so its findings are about post-fix-up state.

**Alternative considered: extend `pattern-drift-analyzer` or `architecture-review` with the field-graph rules.** Rejected because (a) those agents are tuned to general patterns and overloading them with epic-specific rules dilutes their primary purpose; (b) the field-graph rules retire when the epic completes (commit 16), so having a scoped agent that goes away with the epic is cleaner.

This is a **process / tooling** concern, not a code commit. It doesn't slot into the migration epic; it stands alongside it as a review-discipline improvement.

## Human decision

**Decided <YYYY-MM-DD> by <author>:**

<One-sentence summary of the decision. Make it copy-pasteable into a tooling-change log.>

**Reasoning (the human's words, captured for future revisits):**

> *"the whole, you know, enforcer doc or enforcer agent for the architecture."*

Brief reference; the user noted this as one of the docs they want spun up alongside the parser-boundary and tier explorations. The deeper context — what specifically the enforcer should enforce — is the question this doc opens for discussion.

**Where the decision deviates from the recommendation:**

- *Pending finalization.*

**Scope of decision:**

- Process / tooling change. No epic commit slot needed.
- If accepted: agent definition lives at `.claude/agents/field-graph-enforcer.md`. Invocation point: per-commit review chain (added to `prompt-skeleton.md`'s orchestration list).
- If rejected (or deferred until post-epic): document the decision and continue relying on the implementing AI's self-checks + existing review agents.

**Status:** discussion captured; decision pending.

**Future revisit triggers:**

- A regression slips through that one of the codified rules should have caught (e.g. a future commit re-introduces a duplicated normalization layer; or a `Node.tags`-style anti-pattern).
- The migration epic completes (commit 16). At that point, decide whether to retire the enforcer or generalize its rule set into the existing `architecture-review` agent.

---

## 1. The problem

### 1.1. Rules are accumulating; reviewers are shallow

The migration epic has surfaced rules that don't fit the existing review agents' templates. Examples from prior commits:

- **Cumulative API surface check.** Commits 4 + 5 added 14 query methods to `FieldGraph`. None of the per-commit reviews flagged the trajectory; the human had to spot it (commit 5's "API-width follow-up scoped as commit 5b" finding). The result: a whole interlude commit (5b) to refactor.
- **Dead code drained.** Commits 5 and 5c each had bonus deletable code that wasn't slated for the commit's scope. Each time, the human had to spot it.
- **Variable-swap is not cutover.** Commit 5's first pass replaced `INTERNAL_FIELD_NAMES.DATE` with `_DATE_NODE.id` *inside* a 5-branch if/else ladder — letter, not spirit. Spotted by user review, captured as a prompt-skeleton self-check. Pattern-drift analyzer hadn't flagged it.
- **Two-way breadcrumbs.** Commit 10's first-pass breadcrumbs were one-way (file → "future commit") without the reverse direction (commit's epic entry → file). Discipline added during commit 10 review. Easy to forget.
- **Consumer code reasoning about renames.** Commit 10's first pass exported `legacyKeysOf` / `renamesOf` from the top-level barrel. Tests-only, but exposing them in the consumer-facing API risks consumers using them. Spotted by user review, fixed.

Each of these is a class of rule that single-commit agents don't naturally catch because:
- **Single-commit agents look at the diff, not the trajectory.** They can't see "oh, this is the 6th commit in a row that grew the engine class."
- **Single-commit agents enforce general patterns, not epic-specific ones.** They don't know "no procedural transforms in `resolveFieldByAnyKey`" because that's a rule local to one feature epic.
- **Single-commit agents don't audit cross-doc state** (does this commit's epic entry mention all touched files? does the breadcrumb in the source file reference the same commit?).

### 1.2. Where rules live today

| Rule source | Reader |
|---|---|
| `field-graph-for-ai.md` | implementing AI; some review agents |
| `catalog/PATTERN.md` (four-question litmus) | implementing AI |
| `catalog/edges/PATTERN.md` (per-concept directories) | implementing AI |
| `EPIC-migration.md` preamble §5–§10 (cutover, evolving epic, conventions) | implementing AI |
| `prompt-skeleton.md` self-checks (cutover, conditional-logic, trajectory, dead code, epic evolution) | implementing AI |
| `Notes-and-findings.md` (cross-commit learnings, deferred work) | implementing AI |
| `EXPLORATION-*.md` decisions | implementing AI |

The implementing AI is supposed to apply all of these. It's a lot of state. The review agents are supposed to catch what the implementing AI missed — but they have their own narrower scopes.

## 2. The proposed agent

### 2.1. Scope

`field-graph-enforcer` is a per-commit review agent specifically scoped to field-graph migration rules:

**Audits the diff for:**
- Direct references to deleted helpers (`V2_TO_V3_FIELD_MAP`, `LEGACY_FIELD_MIGRATIONS`, `legacyTypeFallback`, etc. — list grows with each commit).
- `Node.tags` reintroduction (forbidden per commit 5b).
- Engine method additions (warns on every new public method on `FieldGraph`; the engine class is closed for new query methods per 5b).
- Top-level barrel exports of debug/introspection queries (warns on `*Of` patterns whose name suggests rename / lifecycle / debug intent).
- Per-field switch ladders or `if (fieldName === X) { ... } else if (fieldName === Y) { ... }` patterns (catches variable-swap-not-cutover).

**Audits cross-doc state for:**
- Two-way breadcrumb compliance: every `TRANSITIONAL` comment in the diff references a specific commit number; that commit's epic entry's "Files touched" line includes this file.
- Exploration-doc Human decision section presence (any new `EXPLORATION-*.md` in the diff has the placeholder).
- Notes-and-findings entries appended for the current commit number.

**Audits trajectory:**
- Engine method count after this commit (warns at thresholds).
- Catalog edge count after this commit (informational, not warning).
- Dead-code candidates: imports of `from './<deleted>'` paths, unused exports.

**Returns findings with severity:**
- `BLOCKING` — rules that must be addressed before the commit ships.
- `WARNING` — trajectory or compliance smells that the implementing AI should surface in the report-back.
- `INFO` — observations the human might want to know.

### 2.2. Where it runs

In the per-commit review chain, AFTER pattern-drift / architecture / code-org / localization / local-storage-safety. Rationale: those agents may apply fixes; the enforcer audits the post-fix state.

The orchestration protocol in CLAUDE.md gets one new entry between Step 8 (Local Storage Safety) and Step 9 (Final Summary):

```
Step 8.5: Field-Graph Enforcer Review (epic only)
- Invokes Field-Graph Enforcer Agent
- Agent runs every rule in the field-graph rule set against the diff
- Returns findings; Main Agent addresses blocking / warning before final summary
```

### 2.3. Lifespan

The agent lives only while the field-graph migration epic is active. When commit 16 lands and the epic completes:

- **Option (a): retire.** Delete the agent definition. The accumulated rules either generalize (and move into existing review agents) or were epic-specific (and aren't needed post-epic).
- **Option (b): generalize.** Lift the still-relevant rules (no `Node.tags`, engine method count, two-way breadcrumbs as a process discipline) into the existing `architecture-review` agent. The epic-specific rules (`V2_TO_V3_FIELD_MAP` is gone, etc.) drop out.

Decision deferred until commit 16 starts. At that point we'll know which rules survived as general patterns vs which were just epic-local.

## 3. Alternatives considered

### Alt-A — Extend `pattern-drift-analyzer`

Add field-graph rules as an additional check in pattern-drift. Rejected because pattern-drift is tuned for general-purpose drift detection across the codebase; loading it with epic-specific rules dilutes the primary purpose, and the rules retire when the epic ends.

### Alt-B — Extend `architecture-review`

Same reasoning as Alt-A. Architecture review is general-purpose; field-graph is feature-specific and time-bounded.

### Alt-C — Manual self-check in `prompt-skeleton.md` only

This is what we have today. Rejected as not enough — commit 5's review-process-gap finding shows that even with self-checks, trajectory smells are spotted by the human, not the AI.

### Alt-D — No new agent; tighten the prompt-skeleton self-checks

Possible. Would lower tooling overhead but keeps the implementing AI as the only checker. Risk: the implementing AI's self-check loop runs at the start of the commit; the rules audit the END state of the commit. A separate review pass at the end is structurally better.

## 4. Open questions for the human

1. **Is the field-graph rule set stable enough to codify as agent rules?** Some rules are still emerging (parser-boundary resolution decision, tier-handling decision). The agent might thrash if rules change mid-epic. Mitigation: the agent definition lives in version control; rule changes are diffable.
2. **Per-commit cost.** Adding one more agent to the review chain extends the per-commit review time. Worth it? Mitigation: the agent runs late in the chain, only on field-graph-touching diffs (could gate by file paths matching `src/shared/domain/field-graph/**` or `docs/field-graph/**`).
3. **Where does the rule set live?** Spread across multiple docs today. The agent would either (a) read the existing docs at invocation time (DRY but slow / parsing-fragile) or (b) embed a curated subset in its own definition (faster but creates a second source of truth). Recommendation: (a) for now, with a `field-graph-rules.md` consolidator that links to all the rule sources.
4. **Replace or augment the existing self-checks?** The prompt-skeleton's self-checks (cutover, conditional-logic, trajectory, dead code, epic evolution) overlap with what the agent would audit. Decide whether to delete the self-checks (single source of truth in the agent) or keep both (defense in depth, at risk of redundancy).
