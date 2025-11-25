import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppPage } from '../../page-objects/app-page';
import { AddGameRunModal } from '../../page-objects/add-game-run-modal';
import { GameRunsPage } from '../../page-objects/game-runs-page';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Single Game Run Add E2E Test (Main Project)
 *
 * This test verifies manual single-run entry works for all three run types.
 * It starts with clean state (no seeded data) to test standalone add functionality.
 *
 * Test Flow:
 * 1. Start with empty state (no seededPage fixture)
 * 2. Add farming run via Add Game Run modal
 * 3. Add tournament run via Add Game Run modal
 * 4. Add milestone run via Add Game Run modal
 * 5. Verify all three runs appear in their respective tabs (before refresh)
 * 6. **CRITICAL**: Reload page to verify localStorage persistence
 * 7. Navigate back to runs page and verify all runs still present (after refresh)
 *
 * Uses Page Object Model pattern for maintainability.
 */
// test.describe.configure({ mode: 'serial' });
test.describe('Single Game Run Add', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('adds farming, tournament, and milestone runs and persists to localStorage', async ({ page }) => {
    const appPage = new AppPage(page);
    const gameRunsPage = new GameRunsPage(page);
    const addGameRunModal = new AddGameRunModal(page);

    await appPage.goto();
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    await appPage.dismissNotificationIfVisible();

    const farmingRunData = await fs.readFile(
      path.join(__dirname, '../../fixtures/farming-run.txt'),
      'utf-8'
    );
    const tournamentRunData = await fs.readFile(
      path.join(__dirname, '../../fixtures/tournament-run.txt'),
      'utf-8'
    );
    const milestoneRunData = await fs.readFile(
      path.join(__dirname, '../../fixtures/milestone-run.txt'),
      'utf-8'
    );

    await page.waitForTimeout(500);
    await appPage.clickAddGameRun();
    await addGameRunModal.waitForVisible();
    await addGameRunModal.addGameRun(farmingRunData, 'farm');
    await addGameRunModal.waitForClose();

    await appPage.clickAddGameRun();
    await addGameRunModal.waitForVisible();
    await addGameRunModal.addGameRun(tournamentRunData, 'tournament');
    await addGameRunModal.waitForClose();

    await appPage.clickAddGameRun();
    await addGameRunModal.waitForVisible();
    await addGameRunModal.addGameRun(milestoneRunData, 'milestone');
    await addGameRunModal.waitForClose();

    // CRITICAL: Wait for debounced localStorage save to complete (300ms debounce + async save)
    // Our persistence layer uses a 300ms debounce to batch rapid changes
    await page.waitForTimeout(500);

    await gameRunsPage.goto();
    await gameRunsPage.waitForTableLoad();

    let farmRowCount = await gameRunsPage.getTableRowCount();
    expect(farmRowCount).toBe(1);

    await gameRunsPage.expandRow(0);

    const realTime = await gameRunsPage.getExpandedRowFieldValue(0, 'Real Time');
    const gameTime = await gameRunsPage.getExpandedRowFieldValue(0, 'Game Time');
    const tier = await gameRunsPage.getExpandedRowFieldValue(0, 'Tier');

    expect(realTime).toBe('12h 44m 28s');
    expect(gameTime).toBe('2d 14h 47m 50s');
    expect(tier).toBe('11');

    await gameRunsPage.switchToTournamentTab();
    let tournamentRowCount = await gameRunsPage.getTableRowCount();
    expect(tournamentRowCount).toBe(1);

    await gameRunsPage.switchToMilestoneTab();
    let milestoneRowCount = await gameRunsPage.getTableRowCount();
    expect(milestoneRowCount).toBe(1);

    // CRITICAL: Wait for debounced localStorage save to complete (300ms debounce + async save)
    // Our persistence layer uses a 300ms debounce to batch rapid changes
    await page.waitForTimeout(500);

    // Page refresh verifies that added runs persist to localStorage (not just in-memory state)
    await page.reload();

    await gameRunsPage.goto();
    await gameRunsPage.waitForTableLoad();

    farmRowCount = await gameRunsPage.getTableRowCount();
    expect(farmRowCount).toBe(1);

    await gameRunsPage.switchToTournamentTab();
    tournamentRowCount = await gameRunsPage.getTableRowCount();
    expect(tournamentRowCount).toBe(1);

    await gameRunsPage.switchToMilestoneTab();
    milestoneRowCount = await gameRunsPage.getTableRowCount();
    expect(milestoneRowCount).toBe(1);
  });
});
