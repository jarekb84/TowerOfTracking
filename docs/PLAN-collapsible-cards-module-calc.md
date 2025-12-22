# Implementation Plan: Collapsible Cards for Module Calculator

## Overview

Transform the module calculator right panel from a static vertical stack into collapsible cards that reduce visual clutter and allow users to focus on relevant sections.

---

## Phase 1: Create CollapsibleCard Component

**Files to create:**
- `src/components/ui/collapsible-card.tsx`

**Implementation:**
1. Build a reusable `CollapsibleCard` component with:
   - Header with title, summary slot, and chevron toggle icon
   - Smooth height transition using CSS `max-height` or grid-based animation
   - Props: `title`, `summary`, `defaultExpanded`, `onToggle`, `children`
2. Follow existing card styling: `bg-slate-800/30 rounded-lg border border-slate-700/50`
3. Use chevron rotation pattern from `nav-collapse-button.tsx` (`rotate-180` on collapse)
4. Apply `transition-all duration-300` for smooth animations

**Key design decisions:**
- No nested card patterns - content renders flat inside the card
- Chevron icon on the left for click target, summary on the right
- Header is fully clickable to toggle

---

## Phase 2: Add Collapse State Management

**Files to create:**
- `src/features/tools/module-calculator/use-collapse-state.ts`

**Implementation:**
1. Create hook to manage collapse state for all cards:
   - `targetSummary`, `simulation`, `practiceMode`, `rollLog`
2. Persist to localStorage using existing `module-calc-persistence` pattern
3. Provide toggle callbacks for each section
4. Default state: Target Summary and active mode card expanded

---

## Phase 3: Wrap Target Summary Panel

**Files to modify:**
- `src/features/tools/module-calculator/target-summary/target-summary-panel.tsx`
- `src/features/tools/module-calculator/module-calculator.tsx`

**Implementation:**
1. Create summary generator function:
   - Format: `"2 locked | 1 target | Pool: 101"` or `"No targets"`
2. Wrap panel content with `CollapsibleCard`
3. Move summary calculation to hook layer
4. Remove existing outer container styling (card handles it)

---

## Phase 4: Wrap Monte Carlo Simulation Panel

**Files to modify:**
- `src/features/tools/module-calculator/results/results-panel.tsx`

**Implementation:**
1. Create summary generator:
   - When results exist: `"Best: 450 | Typ: 1.2K | Worst: 3.8K"`
   - When running: `"Simulating... 45%"`
   - When empty: `"No results yet"`
2. Wrap with `CollapsibleCard`
3. Flatten any nested card patterns in results display
4. Convert mini-cards (best/typical/worst) to inline stats row

---

## Phase 5: Wrap Manual Practice Mode Panel

**Files to modify:**
- `src/features/tools/module-calculator/manual-mode/manual-mode-panel.tsx`

**Implementation:**
1. Create summary generator:
   - Format: `"43 rolls | 12,450 shards spent"` or `"Ready to practice"`
2. Wrap entire manual mode section with `CollapsibleCard`
3. **Critical**: Flatten internal structure per PRD constraint:
   - Replace nested cards with section headings + divider lines
   - Use `border-t border-slate-700/30` dividers between sections
   - Sections: Module Info, Effect Slots, Actions (with shard counter)
4. Keep Roll Log as separate collapsible card (not nested inside)

---

## Phase 6: Wrap Roll Log Panel

**Files to modify:**
- `src/features/tools/module-calculator/manual-mode/roll-log/roll-log.tsx`

**Implementation:**
1. Create summary generator:
   - Format: `"12 entries | Latest: Legendary Critical"` or `"Empty"`
2. Extract Roll Log from Manual Mode Panel into standalone component
3. Wrap with `CollapsibleCard`
4. Remove existing toggle switch (collapse handles visibility now)
5. Keep filter controls inside expanded content

---

## Phase 7: Update Sidebar Layout

**Files to modify:**
- `src/features/tools/module-calculator/module-calculator.tsx`

**Implementation:**
1. Import and wire up `useCollapseState` hook
2. Update sidebar layout:
   - Replace `space-y-6` with dynamic spacing
   - Use `gap-1` when adjacent cards are both collapsed
   - Use `gap-4` when at least one is expanded
3. Add collapse state props to all wrapped panels
4. Ensure mode toggle stays outside collapsible cards

---

## Phase 8: Polish & Edge Cases

**Implementation:**
1. Handle empty states in all summaries
2. Add reduced-motion support: `motion-reduce:transition-none`
3. Test localStorage persistence on page reload
4. Verify simulation state persists when collapsed
5. Test with extremely long roll logs (100+ entries)

---

## File Change Summary

| File | Action |
|------|--------|
| `src/components/ui/collapsible-card.tsx` | Create |
| `src/features/tools/module-calculator/use-collapse-state.ts` | Create |
| `src/features/tools/module-calculator/module-calculator.tsx` | Modify |
| `src/features/tools/module-calculator/target-summary/target-summary-panel.tsx` | Modify |
| `src/features/tools/module-calculator/results/results-panel.tsx` | Modify |
| `src/features/tools/module-calculator/manual-mode/manual-mode-panel.tsx` | Modify (major refactor) |
| `src/features/tools/module-calculator/manual-mode/roll-log/roll-log.tsx` | Modify |

---

## Testing Requirements

1. **Unit tests** for `useCollapseState` hook
2. **Unit tests** for summary generator functions
3. **Component tests** for `CollapsibleCard` transitions
4. **E2E tests** for collapse/expand interactions
5. **E2E tests** for localStorage persistence

---

## Success Metrics

- All 4 sections collapsible independently
- Summaries display meaningful info when collapsed
- Simulation results persist when collapsed
- Smooth 300ms transitions
- Reduced scrolling in typical workflows
- No nested cards in right panel
