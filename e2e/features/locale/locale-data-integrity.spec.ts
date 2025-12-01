import { test, expect } from '../../fixtures/seeded-page';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppPage } from '../../page-objects/app-page';
import { GameRunsPage } from '../../page-objects/game-runs-page';
import { AddGameRunModal } from '../../page-objects/add-game-run-modal';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Locale Support E2E Tests
 *
 * Verifies that locale/regional format settings work correctly:
 * - Display format changes affect how values are shown (period vs comma decimal)
 * - Import/export format settings allow parsing data in different regional formats
 * - Underlying data integrity is preserved when changing locale settings
 * - Data persists correctly across page reloads with different locale settings
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Locale Support', () => {
  test('comprehensive locale format switching with import and persistence', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const gameRunsPage = new GameRunsPage(seededPage);
    const addGameRunModal = new AddGameRunModal(seededPage);

    // Load Italian locale fixture data
    const italianLocaleRunData = await fs.readFile(
      path.join(__dirname, '../../fixtures/farming-italian-locale-run.txt'),
      'utf-8'
    );

    // =================================================================
    // STEP 1: Verify initial state with US format (period decimal)
    // =================================================================
    await appPage.goto();
    await appPage.navigateToFarmRuns();
    await gameRunsPage.waitForTableLoad();

    // Verify first row Coins column shows US format (period decimal)
    // Seed data has 11.51T which displays as "11.51T" in US format
    const usCoins = await gameRunsPage.getCellValue(0, 'Coins');
    expect(usCoins).toBe('11.51T');

    // =================================================================
    // STEP 2: Navigate to locale settings and change formats
    // =================================================================
    // Use sidebar navigation to handle base URL correctly (CI uses /TowerOfTracking prefix)
    await appPage.navigateToRegionalFormat();

    // Wait for locale settings form to be fully rendered
    const decimalSeparatorGroup = seededPage.locator('[aria-label="Decimal separator selection"]');
    await expect(decimalSeparatorGroup).toBeVisible();

    // Change Import/Export Format decimal separator to comma
    // The button label shows "43,91T" for comma format
    const commaDecimalButton = decimalSeparatorGroup.locator('button:has-text("43,91T")');
    await expect(commaDecimalButton).toBeVisible();
    await commaDecimalButton.click();

    // Change Display Format to Italian locale
    const localeSelect = seededPage.locator('select[aria-label="Display locale selection"]');
    await expect(localeSelect).toBeVisible();
    await localeSelect.selectOption('it-IT');

    // Wait for settings to be persisted
    await seededPage.waitForTimeout(500);

    // =================================================================
    // STEP 3: Navigate back to farm runs and verify display changed
    // =================================================================
    await appPage.navigateToFarmRuns();
    await gameRunsPage.waitForTableLoad();

    // Verify first row now shows Italian format (comma decimal)
    // Same value 11.51T now displays as "11,51T"
    const italianCoins = await gameRunsPage.getCellValue(0, 'Coins');
    expect(italianCoins).toBe('11,51T');

    // =================================================================
    // STEP 4: Add a new run using Italian/comma format via Add Game Run modal
    // =================================================================
    await appPage.clickAddGameRun();
    await addGameRunModal.waitForVisible();
    await addGameRunModal.addGameRun(italianLocaleRunData, 'farm');

    // Wait for debounced localStorage save to complete
    await seededPage.waitForTimeout(500);

    // =================================================================
    // STEP 5: Verify the added run displays correctly
    // =================================================================
    // Already on farm runs page after modal closes - just wait for table to update
    await gameRunsPage.waitForTableLoad();

    // The newly added run should be at index 0 (newest first)
    // Fixture has 43,91T which displays as "43,9T" with Italian locale
    const addedCoins = await gameRunsPage.getCellValue(0, 'Coins');
    expect(addedCoins).toBe('43,91T');

    // Previous first row is now at index 1
    const originalCoins = await gameRunsPage.getCellValue(1, 'Coins');
    expect(originalCoins).toBe('11,51T');

    // =================================================================
    // STEP 6: Refresh the page and verify data persists correctly
    // =================================================================
    await seededPage.reload();
    await gameRunsPage.waitForTableLoad();

    // Verify both rows still display with Italian format after reload
    const reloadedAddedCoins = await gameRunsPage.getCellValue(0, 'Coins');
    const reloadedOriginalCoins = await gameRunsPage.getCellValue(1, 'Coins');

    expect(reloadedAddedCoins).toBe('43,91T');
    expect(reloadedOriginalCoins).toBe('11,51T');
  });
});
