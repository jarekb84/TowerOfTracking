# Smart Field Mapping - Implementation Decomposition

This document breaks the original [PRD-smart-field-mapping.md](./PRD-smart-field-mapping.md) into 4 incremental PRs to reduce risk.

---

## PR Summary

| PR | Name | Risk | Destructive? |
|----|------|------|--------------|
| 1 | Field Discovery Analytics | None | No |
| 2 | Canonical Fields + Enhanced Similarity | None | No |
| 3 | Field Mapping UI (Preview Mode) | None | No |
| 4 | Field Migration System | Medium | Yes |

**Key Principle:** PRs 1-3 are completely non-destructive. PR 4 is the only risky one, and by then we have observability data and a proven UI.

---

## PR 1: Field Discovery Analytics

**Goal:** Add PostHog observability to understand field variation scope before building solutions.

**What it does:**
- Add PostHog events during import to track field variations detected
- Log when similar fields are found (and what the similarity type is)
- Detect potential duplicates in existing localStorage data on app load
- NO UI changes, NO data changes - purely analytics

**PostHog Events:**
- `field_mapping_detected` - On import: total_fields, similar_fields, similar_pairs
- `storage_field_analysis` - On app load: total_unique_fields, potential_duplicates

**Files:**
- `src/shared/analytics/field-analytics.ts` (NEW)
- `src/features/data-import/csv-import/csv-field-mapping.ts` (MODIFY)
- `src/shared/domain/fields/field-discovery.ts` (MODIFY)

**Value:** After 1 week, know how prevalent duplicate fields are before investing in the full solution.

---

## PR 2: Canonical Fields + Enhanced Similarity

**Goal:** Establish game export as "north star" for field names and improve similarity detection.

**What it does:**
- Create canonical field registry from latest game export format
- Add confidence percentages to similarity detection (not just boolean)
- Add pluralization detection (Commander vs Commanders)
- Add developer override list for known complex renames (e.g., "Coins Stolen" → "Guardian coins stolen")

**Confidence Scoring:**
| Match Type | Confidence |
|------------|------------|
| Exact normalized | 100% |
| Case-only difference | 95% |
| Pluralization | 90% |
| Levenshtein 1-2 | 85-95% |
| Developer override | 100% |

**Files:**
- `src/shared/domain/fields/canonical-fields.ts` (NEW)
- `src/shared/domain/fields/developer-field-overrides.ts` (NEW)
- `src/shared/domain/fields/field-similarity.ts` (MODIFY)
- `src/shared/domain/fields/supportedFields.json` (UPDATE)

**Value:** Pure infrastructure - no UI changes, no data changes.

---

## PR 3: Field Mapping UI (Preview Mode)

**Goal:** Build the mapping review UI, but in "preview only" mode - shows what WOULD happen but doesn't apply.

**What it does:**
- Table-based field mapping review component
- Radio buttons: Use Suggested / Add as New / Keep Separate
- Display example values from import AND historical data
- Show count of historical runs affected
- "Remember this choice" checkbox
- **Does NOT apply any mappings** - import proceeds with original field names

**UI Table:**
```
| Import Field | Import Examples | Suggested Mapping | Historical Examples | Runs | Actions |
|--------------|-----------------|-------------------|---------------------|------|---------|
| Commanders   | 5, 8, 12        | Commander         | 3, 7, 11            | 47   | (●) Use Suggested |
```

**Default Selections based on confidence:**
- ≥85%: "Use Suggested" pre-selected
- 60-84%: "Keep Separate" pre-selected
- 0%: "Add as New" pre-selected

**Files:**
- `src/features/data-import/field-mapping/` directory (NEW)
  - types.ts, field-mapping-table.tsx, field-mapping-row.tsx
  - use-field-mapping-review.ts, field-mapping-logic.ts + tests
- `src/features/data-import/csv-import/use-csv-import.ts` (MODIFY)
- `src/features/data-import/csv-import/page/import-page-content.tsx` (MODIFY)

**Value:** Get user feedback on the UI before enabling destructive parts.

---

## PR 4: Field Migration System

**Goal:** The actual migration - apply mappings to imports AND historical data with full safety.

**What it does:**
- When user confirms mappings, apply to imported runs
- Apply same mappings retroactively to ALL historical runs
- Transaction-based: ALL runs succeed or NONE do
- Conflict detection: if BOTH fields have data, ABORT entire migration
- Bump data version to 3
- Save mapping decisions for future imports
- Show backup warning before destructive changes

**Safety Mechanisms:**
1. **Pre-flight check:** Scan ALL runs for conflicts before applying anything
2. **Transaction model:** Build new run array in memory, only write if ALL succeed
3. **Conflict = abort:** If any run has data in BOTH source and target field, abort entire migration
4. **Backup prompt:** "This will modify X historical runs. We recommend exporting your data first. [Export] [Continue] [Cancel]"
5. **PostHog event:** Track success/failure/abort reasons

**Conflict Handling:**
```typescript
// If we detect this case, ABORT
run.fields['Commanders'].value = 5      // Has data
run.fields['Commander'].value = 8       // Also has data!
// → Don't guess which is right. Abort and tell user to fix manually.
```

**Files:**
- `src/shared/domain/fields/field-mapping-storage.ts` (NEW)
- `src/features/data-import/field-mapping/apply-mappings.ts` (NEW)
- `src/features/data-import/field-mapping/historical-migration.ts` (NEW)
- `src/features/data-import/field-mapping/conflict-detection.ts` (NEW)
- `src/shared/domain/data-migrations.ts` (MODIFY - v2→v3)

---

## Known Field Variations (From Production Data)

| Production Field | Game Export (Canonical) | Variation Type |
|-----------------|------------------------|----------------|
| Coins from Blackhole | Coins From Black Hole | Casing + spacing |
| Coins from Orbs | Coins From Orb | Pluralization + casing |
| Commanders | Commander | Pluralization |
| Overcharges | Overcharge | Pluralization |
| Saboteurs | Saboteur | Pluralization |
| Coins Stolen | Guardian coins stolen | Complex rename (developer override) |
| Guardian catches | *(not in export)* | Legacy/removed field |

---

## Edge Cases

1. **Empty imports**: Skip mapping review
2. **All fields match exactly**: Skip mapping review, proceed normally
3. **Conflict (both fields have data)**: ABORT entire migration, tell user to export and fix manually
4. **Empty field values**: Safe to migrate (move non-empty to target, delete empty source)
5. **Deprecated fields with data**: Keep for historical purposes even if not in game export

---

## Out of Scope

- Value normalization (tier "11+" → "11")
- Automatic backup/rollback (just prompt user to export first)
- Web Workers for large datasets
- Field Mapping Manager settings page (future extension)
