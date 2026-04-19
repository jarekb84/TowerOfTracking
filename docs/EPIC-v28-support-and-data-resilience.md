# Epic: V28 Support & Data Resilience

High-level outline of work needed to support The Tower v28, address the data loss risk introduced by the new export format, and make the app more resilient to future game format changes. Each line item below is a candidate story — this doc is for tracking the overall shape of the work, not detailed implementation plans.

## Top-Level Items

1. **Phase 0 Hotfix** — Section-aware parser to stop data loss
2. **Dissonance Run Type** — New run type + tab/filter wiring
3. **Dissonance Workshop Subcategory** — Which workshop was disabled
4. **Dissonance Auto-Detection** — Heuristic detection from stat patterns
5. **V28 Field Mapping** — Canonical names for all new/renamed fields
6. **Internal Schema + Adapter Layer** — Decouple game format from storage
7. **Storage Format Migration** — CSV-in-localStorage → JSON
8. **IndexedDB Migration** — Move off localStorage for larger, structured data
9. **Legacy Data Migration** — Safely migrate existing user data
10. **Community Communication** — Discord updates, data integrity warnings

---

## Details

### 1. Phase 0 Hotfix — Section-aware parser to stop data loss

The vertical clipboard parser currently treats each line as a flat label/value pair. V28 groups fields under section headers (Damage, Coins, Enemies Hit By, etc.) where the same label can appear in 3–5 different sections meaning different things. Last-write-wins means ~20 fields silently overwrite each other on import. This story adds section awareness so each unique `[section + label]` combination maps to a unique field. Ship this fast — it stops the bleeding without touching storage format or architecture.

### 2. Dissonance Run Type

Add `DISSONANCE` to the `RunType` enum, wire it through run type display (color, label), selector options, navigation tabs, route config, and all existing filters. Users manually tag runs as dissonance on import for now. No parser or storage changes — purely an enum value flowing through the existing run-type infrastructure.

### 3. Dissonance Workshop Subcategory

Dissonance runs have four variants based on which workshop was disabled: attack, defense, utility, or ultimate weapon. Add an `_dissonanceWorkshop` internal field (mirroring how `_runType` works), UI for selecting it when tagging a run, subcategory filter on the dissonance runs tab, and consider caching it on `ParsedGameRun` for fast filtering. Depends on item 2.

### 4. Dissonance Auto-Detection

The V28 export doesn't explicitly mark runs as dissonance or indicate which workshop was disabled. However, the data patterns are distinctive — utility-disabled runs have coins near zero, UW-disabled runs have all ultimate weapon damage fields at zero, defense-disabled runs have defense stats at zero, and attack-disabled runs have orders-of-magnitude lower projectile damage. Implement heuristic detection that auto-populates run type and workshop on import with a confidence indicator and manual override. Can be deferred if manual tagging from item 3 is sufficient.

### 5. V28 Field Mapping

The V28 export introduces ~60 new fields (Enemies Hit By, Killed With Effect Active, Health Regenerated breakdowns, Damage Blocked breakdowns, new Currencies fields, etc.) and renames/restructures ~15 existing ones. Build the complete mapping table from `[section, label]` in the V28 format to canonical field names, add all new canonical names to `supportedFields.json`, and document which old fields were removed, renamed, or split. This is the content work that powers the parser in item 1.

### 6. Internal Schema + Adapter Layer

The root cause of recurring data pain is that the app's internal data model IS the game's export format, just camelCased. This story introduces a formal internal schema with namespaced, app-owned field names (e.g., `damage.deathWave`, `coins.deathWave`) and a versioned adapter layer that translates game export formats into that schema. When the game devs rename a field in v29, you add 20 lines to a mapping table instead of refactoring the parser. Unknown fields get preserved in an `extras` bag rather than silently lost. This is the foundational architectural change that makes everything downstream easier.

### 7. Storage Format Migration

Move from CSV-in-localStorage to JSON-in-localStorage, using the internal schema from item 6 as the document structure. Each run becomes a JSON object with canonical field names. CSV export/import stays supported, but as a serialization layer on top of the JSON — not the source of truth. The storage is versioned so the app can detect old CSV format and migrate on load. Preserve the old CSV in a separate localStorage key as a safety net during rollout.

### 8. IndexedDB Migration

Once data is in a clean JSON schema (item 7), move the storage backend from localStorage to IndexedDB. IndexedDB offers much larger storage limits, structured queries, and better performance for the kinds of analysis the app does. No data model changes here — just a backend swap. Easier to tackle after item 7 because the data is already in a structured format.

### 9. Legacy Data Migration

The scariest story. Existing users have localStorage data using the pre-V28 field names. When they open the app after these changes ship, their data needs to migrate to the new canonical schema without loss. Build a one-time migration that runs at app load, detects storage format version, maps old field names to new canonical names, preserves any unrecognized fields in the extras bag, and keeps a backup of the original data until the user has successfully imported new runs. Handle partial migrations gracefully — some users may have data from multiple pre-V28 game versions.

### 10. Community Communication

Because there's no server, the app only knows about users when they open it. During this transition, communicate clearly on Discord about what's changing, what data might be affected, and what precautions to take. Include: initial Discord post about the V28 data loss risk and workaround (keep separate copies of exports), release announcements for each phase, and migration guidance when the big architectural changes ship. Consider in-app notifications for users who open the app after a major storage migration to confirm their data made it through.
