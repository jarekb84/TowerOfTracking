import { test, expect } from '@playwright/test';
import { AppPage } from '../../page-objects/app-page';
import { AddGameRunModal } from '../../page-objects/add-game-run-modal';
import { SettingsPage } from '../../page-objects/settings-page';
import { BulkExportModal } from '../../page-objects/bulk-export-modal';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Bulk Export Test
 *
 * Purpose: Verify bulk export functionality works correctly by:
 * 1. Adding three runs (farming, tournament, milestone) from fixture files
 * 2. Navigating to bulk export
 * 3. Exporting the data to CSV
 * 4. Comparing the exported CSV against expected fixture
 *
 * This test does NOT use seededPage - it starts from clean state to test
 * the export workflow with a controlled, minimal dataset.
 */
test.describe('Bulk Export', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('exports farming, tournament, and milestone runs to CSV matching expected format', async ({ page }) => {
    const appPage = new AppPage(page);
    const addModal = new AddGameRunModal(page);

    // Navigate to app (clean state)
    await appPage.goto();

    // Clear localStorage to ensure clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Dismiss any initial notifications
    const dismissButton = page.locator('button:has-text("Dismiss")');
    if (await dismissButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissButton.click();
    }

    // Load fixture data
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

    // === Step 1: Add three game runs ===

    // Add farming run
    await page.waitForTimeout(500);
    await appPage.clickAddGameRun();
    await addModal.waitForVisible();
    await addModal.addGameRun(farmingRunData, 'farm');
    await addModal.waitForClose();

    // Add tournament run
    await appPage.clickAddGameRun();
    await addModal.waitForVisible();
    await addModal.addGameRun(tournamentRunData, 'tournament');
    await addModal.waitForClose();

    // Add milestone run
    await appPage.clickAddGameRun();
    await addModal.waitForVisible();
    await addModal.addGameRun(milestoneRunData, 'milestone');
    await addModal.waitForClose();

    // === Step 2: Navigate to bulk export ===
    await appPage.navigateToBulkExport();
    const settingsPage = new SettingsPage(page);

    // Click the export button to open the export dialog
    await settingsPage.clickBulkExport();

    const exportModal = new BulkExportModal(page);
    await exportModal.waitForModalOpen();

    // === Step 3: Get exported CSV content ===
    const exportedCsv = await exportModal.getCsvContent();

    // Basic sanity checks on the exported content
    expect(exportedCsv).toBeTruthy();
    expect(exportedCsv.length).toBeGreaterThan(0);

    // Verify it's tab-delimited (default delimiter)
    expect(exportedCsv).toContain('\t');

    // Verify it contains a header row
    const lines = exportedCsv.split('\n').filter(line => line.trim().length > 0);
    expect(lines.length).toBeGreaterThan(0);

    // Verify we have 4 lines: 1 header + 3 data rows
    expect(lines.length).toBe(4);

    // === Step 4: Compare against expected fixture ===
    const expectedCsv = await fs.readFile(
      path.join(__dirname, '../../fixtures/expected-bulk-export.csv'),
      'utf-8'
    );

    // Normalize line endings for comparison (handle Windows vs Unix)
    const normalizeLineEndings = (str: string) => str.replace(/\r\n/g, '\n').trim();

    expect(normalizeLineEndings(exportedCsv)).toBe(normalizeLineEndings(expectedCsv));

    // Close modal
    await exportModal.close();
  });
});
