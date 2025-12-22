# PRD: Collapsible Cards for Module Calculator Right Panel

## Problem Statement

The module calculator's right-side panel has grown increasingly cluttered as features have been added. Users now face a wall of information that makes it difficult to focus on what's relevant to their current task.

**Information Overload**: The sidebar displays Target Summary, Monte Carlo Simulation controls/results, Manual Practice Mode (with module header, effect slots, banned effects, shard counter, roll controls), and Roll Log all at once. Users report feeling overwhelmed when trying to find specific information.

**Visual Disorganization**: Related content is scattered across multiple separate elements. In Manual Practice Mode, users see module info, slot tables, banned effects, shard tracking, and roll logs as disconnected pieces rather than as a coherent workflow. The lack of visual grouping makes it hard to understand relationships between elements.

**Wasted Vertical Space**: Each card/section has generous padding and spacing optimized for standalone display. When stacked vertically, this creates excessive scrolling. Users must scroll repeatedly to move between simulation results at the top and practice mode content further down.

**Data Duplication**: Some information appears in multiple places. For example, banned effects context appears in both the Target Summary and the Manual Practice panel. This redundancy consumes valuable screen real estate without adding user value.

## Design Constraint: No Nested Cards

**Critical**: The right rail has limited horizontal space. The application has a tendency toward nested card patterns (cards within cards) that compound indentation and waste precious horizontal real estate.

**The Problem with Nested Cards**:
- Each card layer adds padding on both sides (typically 16-24px per layer)
- Two levels of nesting can consume 64-96px of horizontal space just for padding
- In a ~350px right rail, this leaves insufficient width for content like effect slot tables
- Visual hierarchy through nesting comes at too high a cost in constrained layouts

**Design Rule for This Feature**:
- Collapsible cards have ONE level of containment only
- Expanded card content renders directly inside the card - no inner cards
- Use headings, horizontal dividers, or subtle background color shifts to separate subsections
- The card border IS the container - content inside should feel "flat"

**Example - What NOT to Do**:
```
+-- Collapsible Card Border ------------------+
|  +-- Inner Card -------------------------+  |  <-- NO! Double padding
|  |  Content here                         |  |
|  +---------------------------------------+  |
+---------------------------------------------+
```

**Example - Correct Approach**:
```
+-- Collapsible Card Border ------------------+
|  Section Heading                            |
|  ─────────────────────────────────────────  |  <-- Divider line, not card
|  Content directly in card                   |
|                                             |
|  Another Section Heading                    |
|  ─────────────────────────────────────────  |
|  More content, no extra padding layers      |
+---------------------------------------------+
```

This constraint applies specifically to the right rail collapsible cards. Other parts of the application may use nested cards where horizontal space is less constrained.

## User Experience Goals

**Current Behavior (Problematic)**:
1. User opens module calculator with several targets configured
2. User sees a long, scrollable sidebar with all sections fully expanded
3. User must scroll up and down repeatedly to check simulation results, then practice mode, then roll history
4. Completed sections (like target configuration) remain fully visible, pushing active work areas off-screen
5. Related practice mode elements appear disconnected, requiring mental effort to associate them

**Desired Behavior**:
1. User opens module calculator with collapsible cards for each major section
2. User collapses sections not currently needed (e.g., Target Summary after configuration is complete)
3. Each collapsed card shows a compact summary so user knows its contents at a glance
4. User expands only the sections they're actively using
5. Simulation results persist even when collapsed (no re-running needed)

**Key Requirements**:
- Cards can be independently collapsed or expanded (not mutually exclusive like traditional accordions)
- Collapsed cards display a meaningful summary in their header
- Content within collapsed cards is hidden but not destroyed (preserving component state)
- Reduced vertical spacing between cards when collapsed for maximum density
- Smooth, subtle transitions when expanding/collapsing

## User Scenarios

### Scenario 1: Focus on Active Simulation
A user has configured their target effects and wants to run multiple simulations with different confidence levels. They collapse the Target Summary card (seeing "2 locked, targeting 1, pool: 101" in the header) to keep simulation controls and results visible without scrolling. They iterate on simulation settings while maintaining full visibility of the results chart.

### Scenario 2: Practice Mode Session
A user enters Manual Practice Mode for extended rolling practice. They collapse both Target Summary and Monte Carlo Simulation cards since they're focusing on hands-on practice. The Practice Mode controls (module info, effect slots, shard counter) remain expanded. They also collapse Roll Log initially, expanding it periodically to review notable rolls.

### Scenario 3: Reviewing Roll History
After an extended practice session, a user wants to analyze their roll history. They collapse the Practice Mode controls (which shows "43 rolls, 12,450 shards spent" in the header) and expand only the Roll Log card to focus on the tabular data. The practice session state remains intact even though the controls are hidden.

### Scenario 4: Comparing Target Configurations
A user is experimenting with different target configurations to see how they affect simulation costs. They keep the Target Summary expanded to quickly reference their setup while also keeping Monte Carlo results visible. All other sections remain collapsed for a clean, focused view.

## Edge Cases to Consider

1. **First-time user experience**: What default expanded/collapsed state makes sense for new users who haven't configured anything yet? Consider showing Target Summary and the active mode's card expanded by default.

2. **Collapsed state persistence**: Should the app remember which cards the user had collapsed when they navigate away and return? Consider localStorage persistence for user preference.

3. **Extremely long content**: What happens if a roll log has 100+ entries? Ensure the card itself doesn't grow infinitely even when expanded; internal scrolling should handle this.

4. **Empty state summaries**: What should a collapsed Target Summary show when nothing is configured? Consider "No targets" or similar clear indication.

5. **Mode switching behavior**: When user switches from Monte Carlo to Manual mode, should card collapse states reset or persist? Consider keeping collapse states independent of mode.

6. **Mobile viewport**: On narrow screens, should all cards default to collapsed with tap-to-expand? Consider responsive defaults for smaller screens.

7. **Simulation in progress**: If Monte Carlo is collapsed while simulation runs, should it auto-expand when complete or show progress in header?

## What Users Should See

**Collapsed Card Headers**:
```
[v] Target Summary                    2 locked | 1 target | 3 bands | Pool: 101
[v] Monte Carlo Simulation            Best: 450 | Typical: 1,200 | Worst: 3,800
[>] Manual Practice Mode              (click to expand)
[v] Roll Log                          12 entries | Latest: Legendary Critical
```

**Expanded Card Appearance** (flat content, no nested cards):
```
+------------------------------------------------------------------+
| [v] Target Summary          2 locked | 1 target | Pool: 101      |
+------------------------------------------------------------------+
| [>] Monte Carlo Simulation  Best: 450 | Typ: 1.2K | Worst: 3.8K  |
+------------------------------------------------------------------+
| [v] Manual Practice Mode                                          |
|                                                                   |
|   Module Info                                                     |
|   ───────────────────────────────────────────────────────────    |
|   Legendary Lv.10 / Max Lv.10                                     |
|                                                                   |
|   Effect Slots                                                    |
|   ───────────────────────────────────────────────────────────    |
|   Slot 1: [Crit Dmg (L)]  Slot 2: [Crit Rate (E)]  ...           |
|                                                                   |
|   Actions                                                         |
|   ───────────────────────────────────────────────────────────    |
|   [Roll] [Auto Roll]     Total: 1,250 shards                      |
+------------------------------------------------------------------+
```

Note: Content renders directly inside the card with section headings and divider lines - no inner cards consuming horizontal space.

**Spacing When Collapsed**:
- Minimal gap (4-8px) between adjacent collapsed cards
- Standard gap when at least one card is expanded

## Success Criteria

From user perspective:
- Users can collapse any sidebar card with a single click
- Users see a meaningful summary when a card is collapsed
- Users' simulation results and practice session data persist when cards are collapsed
- Users experience noticeably less scrolling to access relevant information
- Users can have multiple cards expanded simultaneously
- Users see smooth visual transitions when collapsing/expanding

## Out of Scope

- **Keyboard shortcuts for collapse/expand** - Future enhancement
- **Drag-to-reorder cards** - Would add complexity, consider later
- **Save/load card layout presets** - Over-engineering for initial release
- **Animation preferences setting** - Users with motion sensitivity can use reduced-motion OS settings
- **Per-mode collapse state memory** - Keep it simple with global collapse state initially

## Future Extensions

After this ships, users may want keyboard shortcuts (press 1-4 to toggle cards) or the ability to reorder cards based on their workflow preferences. The collapsible card pattern could also extend to other dense panels in the application, creating a consistent interaction model. A "collapse all" / "expand all" quick action could be valuable for users who frequently switch between focused and overview modes.

## Architecture Notes

- The sidebar uses inline styling with `space-y-6` gap; will need conditional spacing based on collapse states
- Current panels (Target Summary, Results, Manual Mode) are standalone components without shared wrapper
- No existing accordion or collapsible primitive in the UI library; will need a new CollapsibleCard component
- Manual Mode currently uses multiple child cards - these must be flattened into section headings with dividers, NOT nested cards
- Monte Carlo results (best/typical/worst mini-cards) should become inline stats or a simple row, not nested cards
- Monte Carlo simulation state lives in a hook; CSS-only hiding will preserve this state correctly
- Use Tailwind's `divide-y` or custom divider components for visual separation within expanded cards

---

## Design Feedback (Post-Implementation Review)

### Remove Mode Toggle - Show Both Panels

**Change**: Remove the Monte Carlo vs Practice mode switch/tab. Instead, display:
1. Monte Carlo Simulation as its own collapsible card
2. Manual Practice Mode as a separate collapsible card below it

Both should always be visible (collapsed or expanded), not mutually exclusive. Users may want to reference simulation results while practicing, or vice versa.

### Manual Practice Mode - Flatten Nested Cards

The PRD correctly calls out avoiding nested cards, but the current implementation has two components with card-like styling that should be flattened:

**Components to FLATTEN (remove card styling):**

1. **ModuleHeader** (module rarity badge + level display)
   - Current: `p-3 bg-slate-800/30 rounded-lg border border-slate-700/50`
   - Change: Remove the background, border, and rounded corners
   - Keep the content layout, just remove the "card" wrapper appearance

2. **ShardCounter** (spent/balance, cost per roll, total rolls, roll buttons)
   - Current: `p-4 bg-slate-800/30 rounded-lg border border-slate-700/50`
   - Change: Remove the background, border, and rounded corners
   - The shard icon, balance display, and buttons remain - just no containing card

**Components that CAN keep card-like styling:**

1. **Effect slot rows** - Individual slot rows with borders are acceptable because:
   - They highlight when locked (functional visual feedback)
   - The border indicates interactivity
   - This is more like a "list item with state" than a nested card

### Visual Example After Changes

```
+-- Manual Practice Mode (Collapsible Card) ----------------+
|                                                           |
|   [Reset] [Exit]                                          |
|                                                           |
|   ─────────────────────────────────────────────────────   |
|   LEGENDARY          Level 10 / 200                       |  <- No card wrapper
|                                                           |
|   ─────────────────────────────────────────────────────   |
|   [Slot 1: Crit Dmg (L)] [Slot 2: Crit Rate (E)] ...     |  <- Row borders OK
|                                                           |
|   ─────────────────────────────────────────────────────   |
|   🔶 Spent: 1,250      Cost: 50      Rolls: 25           |  <- No card wrapper
|   [Reroll]  [Auto]                                        |
|                                                           |
+-----------------------------------------------------------+
```

### Implementation Impact

Files to modify:
- `src/features/tools/module-calculator/manual-mode/module-header.tsx` - Remove card styling
- `src/features/tools/module-calculator/manual-mode/shard-counter.tsx` - Remove card styling
- `src/features/tools/module-calculator/calculator-sidebar.tsx` - Remove ModeToggle, show both panels
- `src/features/tools/module-calculator/mode-toggle.tsx` - Can be deleted or kept for future use
