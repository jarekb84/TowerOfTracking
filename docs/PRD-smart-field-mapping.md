# PRD: Smart Field Mapping and Data Migration System

## Problem Statement

The Tower game's battle history export format evolves over time. The game developers periodically change field names through casing variations (e.g., "Coins From Upgrade" vs "Coin from coin upgrade"), pluralization changes (e.g., "Wave" vs "Waves"), addition or removal of articles (e.g., "The Death Wave" vs "Death Wave"), and the introduction of entirely new columns.

For long-term users of TowerOfTracking, this is the primary source of data friction. Each time the game updates its export format, users importing their latest battle history encounter field name mismatches with their existing historical data. The system currently cannot reconcile these variations, leading to fragmented data where the same metric appears under multiple column names.

**Primary Use Case**: Ongoing game export format changes affecting existing users

**Secondary Use Case**: Initial adoption from other tools (CSV import from spreadsheets, other tracking apps)

This creates several pain points:
- **Data fragmentation**: The same metric (e.g., coins earned from upgrades) may appear as multiple columns due to game export format changes over time
- **Repeated warnings**: Users see the same "similar field detected" warnings every time they import, with no way to resolve them permanently
- **Historical data inconsistency**: When the game changes a field name, users cannot easily update their existing historical data to match
- **Migration friction**: When the app itself updates its field naming conventions, users must manually reconcile their stored data

The current system has partial support for similarity detection (showing warnings about possible duplicates) but does not allow users to act on those warnings or have their decisions remembered.

## User Experience Goals

**Current Behavior (Problematic)**:
1. User exports latest battle history from the game (game devs changed "Coins From Upgrade" to "Coin from coin upgrade")
2. User pastes data into TowerOfTracking
3. System shows warning: "Similar to existing field 'Coins From Upgrade'"
4. Data imports as a NEW column anyway
5. User now has fragmented data—old runs under one name, new runs under another
6. Analytics charts show incomplete data because metrics are split across columns
7. Next import shows the same warning again

**Desired Behavior**:
1. User exports latest battle history from the game (with changed field names)
2. User pastes data into TowerOfTracking
3. System detects field name changes and presents a mapping review table
4. User sees which fields changed, example data from both import and history, and how many runs are affected
5. User confirms mappings (or keeps fields separate if they're genuinely different)
6. System applies mapping to imported data AND updates historical data for consistency
7. Future imports automatically use the remembered mapping
8. All data is consolidated under consistent field names

**Key Requirements**:
- Detect field variations (casing, spacing, pluralization, articles) and present suggestions to user
- **No automatic conversions** - user must see and confirm all mapping decisions (defaults are pre-selected based on match confidence, but user sees the choice)
- Present actionable suggestions in a tabular format with radio button selections
- Show example data from both import and historical data to help users verify mappings
- Display count of historical runs affected by each mapping
- Allow users to confirm OR reject mapping suggestions with single-click radio buttons
- Remember user mapping decisions across sessions (checked by default)
- Apply field remapping retroactively to historical data when user confirms

## User Scenarios

### Scenario 1: Game Export Format Change (Primary)
A long-term user has been tracking runs for months. The game developers release an update that changes "Coins From Upgrade" to "Coin from coin upgrade" and "Wave" to "Waves" in the battle history export. When the user imports their next batch of runs, the system detects these changes and presents a mapping review table. The user sees example values from both the import ("1.5M", "245") and their historical data ("2.1M", "312"), confirms these are the same fields, and the system updates both the imported data and 156 historical runs to use consistent naming.

### Scenario 2: Pluralization and Article Changes
The game changes "The Death Wave Damage" to "Death Wave Damage" (dropped article) and "Enemy" to "Enemies" (pluralization). The system detects these as high-confidence matches and presents them in the mapping review table with "Use Suggested" pre-selected. The user reviews the table, sees the example data confirms these are the same fields, and clicks "Apply Mappings" to proceed. No automatic conversion happens without user confirmation.

### Scenario 3: Genuinely New Field from Game Update
The game adds a new metric "Tournament Placement" that never existed before. The system recognizes this as a genuinely new field (no similar matches), adds it to the data, and shows in the import summary: "New field added: Tournament Placement (first time seen)." No mapping decision needed.

### Scenario 4: Resolving Ambiguous Similar Fields
A user imports data containing "Death Ray Damage" but the system already has "Death Wave Damage" from previous imports. The similarity detection flags this as potentially related. The mapping table shows example values from both, allowing the user to see they are actually different metrics (different value ranges). The user confirms these are separate fields. The system remembers this decision and stops showing the warning for this specific pair.

### Scenario 5: CSV Import from External Source (Secondary)
A new user wants to migrate data from their personal spreadsheet that uses custom column names like "My Coins" instead of "Coins Earned." The mapping review table shows the suggested mappings with example data from both sources. The user confirms which fields should map to existing analytics fields vs. which should be kept as custom fields. The "remember this choice" option is checked by default.

### Scenario 6: App Version Migration Detection (Requires Further Exploration)
A user opens TowerOfTracking after an app update that changed internal field naming conventions. On startup, the system detects the version mismatch and shows a toast notification: "Data format update available. Import a new game run to apply updates." The system does NOT automatically migrate data to avoid any risk of data loss without user consent.

When the user next imports a game run (single or bulk), they see the mapping review table which includes both the new import's field differences AND any version-related field updates. The user confirms the mappings, and historical data is updated accordingly.

**Note**: This scenario needs further exploration during implementation. Key questions:
- What happens if user never imports new data? (Their existing data still works, just may not benefit from new features)
- Should there be a manual "Apply Migration" option in settings for users who want to update without importing?
- Edge cases around partial migrations if user cancels mid-process

## Edge Cases to Consider

1. **User imports empty CSV or header-only file**: What feedback should the user receive? Should the field mapping UI still appear?

2. **User has conflicting mappings**: What if a user previously mapped "MyField" to "FieldA" but now wants to map it to "FieldB"? How do they update or remove old mappings?

3. **Retroactive mapping creates data conflicts**: When applying a mapping to historical data, what happens if some runs already have values in both the source and target fields with DIFFERENT values?
   - **Proposed handling**: Show a conflict resolution dialog listing affected runs
   - Options: "Keep import value", "Keep historical value", or "Review case-by-case"
   - If values are identical, safe to consolidate silently

4. **User imports same data twice**: If the same rows are imported again with the newly mapped field names, how do we detect and handle duplicates?

5. **Mapping target field does not exist yet**: User wants to map an imported field to a "canonical" name that is not in any existing data. Should this be allowed?

6. **Very large historical data set**: When retroactive mapping is applied to thousands of runs, should this happen immediately or be processed in the background?

7. **User cancels mid-migration**: What happens if the user closes the browser during a retroactive mapping operation?

8. **Similar field suggestions are wrong**: How easily can the user dismiss a similarity suggestion that is incorrect (e.g., "Death Ray" vs "Death Wave" are legitimately different)?

9. **Multiple similar fields (3+ way conflict)**: What if "Wave", "Waves", and "wave_count" all appear similar? How do we present this to the user?

10. **Circular dependency prevention**: Prevent mapping chains like A→B→C→A that could corrupt data

11. **Empty field values**: Skip migration for fields with empty/null values - don't overwrite existing data with blanks

## What Users Should See

**During Import - Field Mapping Review Table**:

When field differences are detected, present a tabular layout (not individual cards) that allows users to review all mappings at once. Use radio button columns for single-click action selection:

```
+----------------------------------------------------------------------------------------------------------------------------------+
|  Field Mapping Review                                                                                                12 fields   |
+----------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                  |
|                        |                      |                             |                     |       |        Action        |
|  Import Field          | Import Examples      | Suggested Mapping           | Historical Examples | Runs  | Use    | Add as | Keep     |
|                        |                      |                             |                     |       | Sugg.  | New    | Separate |
|  ----------------------|----------------------|-----------------------------|---------------------|-------|--------|--------|----------|
|  Coins From Upgrade    | 1.5M, 2.3M, 890K    | Coin from coin upgrade      | 2.1M, 1.8M, 3.2M   |   47  |  (●)   |  ( )   |   ( )    |
|  Wave                  | 245, 312, 198        | Waves                       | 301, 287, 256      |  156  |  (●)   |  ( )   |   ( )    |
|  The Death Wave        | 15.2K, 8.7K          | Death Wave                  | 12.1K, 9.8K        |   89  |  (●)   |  ( )   |   ( )    |
|  Tournament Rank       | 1, 5, 12             | (new field)                 | —                  |    —  |  ( )   |  (●)   |   ( )    |
|  Death Ray Damage      | 45.2K, 32.1K         | Death Wave Damage (62%)     | 8.7K, 6.2K         |   89  |  ( )   |  ( )   |   (●)    |
|                                                                                                                                  |
|  [✓] Remember these choices for future imports                                            [Cancel]  [Apply Mappings]            |
|                                                                                                                                  |
+----------------------------------------------------------------------------------------------------------------------------------+
```

**Table Columns Explained**:
- **Import Field**: The field name from the data being imported
- **Import Examples**: 2-3 sample values from the import data
- **Suggested Mapping**: The existing field we think this maps to, with similarity % for ambiguous matches
- **Historical Examples**: Sample values from existing historical data for that field
- **Runs**: Count of historical runs that have data populated for this field (helps understand impact)
- **Action** (spans 3 sub-columns with radio buttons):
  - **Use Suggested**: Map to the suggested existing field (pre-selected for high-confidence matches)
  - **Add as New**: Import as a genuinely new field (pre-selected when no similar match exists)
  - **Keep Separate**: Import as a distinct field, even if similar match exists (pre-selected for low-confidence matches)

**Key UI Behaviors**:
- Radio buttons allow single-click changes (no dropdown interaction needed)
- Default selection based on match confidence percentage from similarity algorithm
- Checkbox "Remember these choices" is checked by default
- Rows are pre-sorted: high-confidence mappings first, ambiguous matches last
- "(new field)" indicator for genuinely new fields with no mapping suggestion
- Similarity percentage shown for lower-confidence matches to help users decide
- **No automatic conversions** - user must click "Apply Mappings" to confirm all decisions

**Instructional Text** (shown above the table):

For game export field changes:
> "We've detected field name changes that may be from a game update. Please verify by checking your latest game export. Select the field version you want to use going forward—we'll consolidate all historical data under that name."

For custom/external imports:
> "These fields from your import don't match existing fields. Select whether to map them to existing fields or add them as new custom fields."

**App Version Update Detection (Toast Notification)**:
```
+--------------------------------------------------+
|  Update Available                          [X]   |
|                                                  |
|  A data format update is available.              |
|  Import a new game run to apply updates.         |
|                                                  |
+--------------------------------------------------+
```
Note: No automatic migration occurs. User is notified and guided to take action during their next import.

**Import Summary with Applied Mappings**:
```
+--------------------------------------------------+
|  Import Summary                                  |
+--------------------------------------------------+
|  23 runs imported successfully                   |
|                                                  |
|  Field Mappings Applied:                         |
|    "Coins From Upgrade" -> "Coin from coin..."   |
|      (47 historical runs also updated)           |
|    "Wave" -> "Waves"                             |
|      (156 historical runs also updated)          |
|    "The Death Wave" -> "Death Wave"              |
|      (89 historical runs also updated)           |
|                                                  |
|  New Fields Added:                               |
|    "Tournament Rank" (first time seen)           |
|                                                  |
|  Kept Separate:                                  |
|    "Death Ray Damage" (confirmed different)      |
|                                                  |
+--------------------------------------------------+
```

## Success Criteria

**User Experience**:
- Users can import data from any source without worrying about exact field name matching
- Users are prompted only once per unique field variation, not on every import
- Users can apply field mappings retroactively to fix historical data inconsistencies
- Users can review and manage their saved field mappings
- Users understand which fields were mapped vs newly created vs kept separate

**Data Integrity**:
- Zero duplicate fields remain after user completes consolidation
- 100% data preservation - no data loss during migration
- User decisions persist across browser sessions

**Performance**:
- Similarity detection completes in < 1 second for up to 100 fields
- Migration completes in < 5 seconds for 500 runs
- UI remains responsive during large operations (progress indicator shown)

## Out of Scope

- **Value normalization** (e.g., tier "11+" to "11"): This requires semantic understanding of field values, not just names. Future enhancement.
- **Bulk import UI reorganization**: Current modal approach is retained; UI layout changes are a separate initiative.
- **Multi-user sync**: This PRD addresses single-user localStorage; cloud sync is not included.
- **Automatic backup/rollback**: No automatic backup before migration. Once migration is applied, users cannot revert. Consider for future if needed.
- **Custom analytics for unmapped fields**: Unmapped fields are stored but may not work with all charts. Full support for arbitrary fields is future work.
- **Web Workers for large datasets**: Performance optimization using background processing is deferred unless testing reveals it's necessary.

## Future Extensions

After this feature ships, users may want:
- A dedicated "Field Mapping Manager" settings page to view/edit all saved mappings
- Export/import of mapping preferences (for sharing between devices or users)
- Smarter similarity detection using field value patterns, not just names
- Value transformation rules (e.g., "if tier contains '+', strip it")
- **Automatic backup before migration**: Create backup of localStorage before consolidation, allow rollback within 24 hours

**Nice-to-Have Enhancement for Historical Impact Display**:
The historical examples column and runs count in the mapping table help users understand the impact of their mapping decisions. As an enhancement, this could be expanded to show:
- Breakdown of how many runs have data vs. empty/null values for that field
- Date range of affected runs (e.g., "47 runs from Jan-Oct 2024")
- Preview of what the merged data would look like before confirming

## Architecture Notes

Based on review of the current codebase:

- **Existing foundation**: The app already has `field-similarity.ts` with Levenshtein distance and normalization algorithms, and `field-discovery.ts` for extracting field names from localStorage. These can be extended for user-controlled mapping.
- **Data migration system exists**: `data-migrations.ts` has versioned migration infrastructure (v1 to v2 complete) that can be extended for field mapping migrations.
- **Storage key coordination**: Field mappings should use a new localStorage key (e.g., `tower-tracking-field-mappings`) separate from run data to avoid coupling.
- **Performance consideration**: Retroactive mapping on large datasets should update the CSV string in localStorage in a single operation, not row-by-row, to avoid performance issues.
- **Analytics integration**: Some fields are hard-coded in analytics code (tier, wave, coinsEarned, etc.). Field mapping only affects "dynamic" fields; core analytics fields require developer updates if renamed by the game.

### Similarity Scoring Thresholds

Used to determine default radio button selection:

| Match Type | Confidence | Default Selection |
|------------|------------|-------------------|
| Exact match (normalized) | 100% | Use Suggested |
| Case difference only | 95% | Use Suggested |
| Pluralization difference only | 90% | Use Suggested |
| Levenshtein distance < 3 | 85-95% (based on string length) | Use Suggested |
| Levenshtein distance 3-5 | 60-85% | Keep Separate |
| No similar match found | 0% | Add as New |

### Field Normalization Rules

When comparing fields for similarity:
1. Convert to lowercase
2. Remove special characters except underscores
3. Trim whitespace
4. Convert spaces to underscores
5. Apply singularization/pluralization detection