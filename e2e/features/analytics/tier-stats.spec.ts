import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { TierStatsPage } from '../../page-objects/tier-stats-page';

/**
 * Tier Stats E2E Tests
 *
 * High-level smoke test: verify page loads, aggregation switching works, and data displays correctly.
 * Unit tests cover detailed functionality.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Tier Stats', () => {
  test('displays tier statistics and supports aggregation switching', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const tierStatsPage = new TierStatsPage(seededPage);

    // Navigate to tier stats page via sidebar
    await appPage.goto();
    await appPage.tierStatsLink.click();
    await tierStatsPage.waitForPageLoad();

    // Verify table has data
    const hasData = await tierStatsPage.hasTableData();
    expect(hasData).toBe(true);

    // Verify initial state: Maximum aggregation should be selected
    const initialAggregation = await tierStatsPage.getCurrentAggregation();
    expect(initialAggregation).toContain('Maximum');

    // Read values from multiple rows with Maximum aggregation
    // Column 0 = tier, column 1 = wave, column 2 = duration, column 3 = coins, column 4 = cells
    const maxValues = [];
    for (let row = 0; row < 5; row++) {
      const tier = await tierStatsPage.getCellValue(row, 0);
      const coins = await tierStatsPage.getCellValue(row, 3);
      const cells = await tierStatsPage.getCellValue(row, 4);
      maxValues.push({ tier, coins, cells });
    }

    // Switch to P75 aggregation
    await tierStatsPage.switchToP75();

    // Verify aggregation changed
    const newAggregation = await tierStatsPage.getCurrentAggregation();
    expect(newAggregation).toContain('P75');

    // Read values from same rows with P75 aggregation
    const p75Values = [];
    for (let row = 0; row < 5; row++) {
      const tier = await tierStatsPage.getCellValue(row, 0);
      const coins = await tierStatsPage.getCellValue(row, 3);
      const cells = await tierStatsPage.getCellValue(row, 4);
      p75Values.push({ tier, coins, cells });
    }

    // Find at least one row where values changed
    let foundChange = false;
    for (let i = 0; i < maxValues.length; i++) {
      const maxRow = maxValues[i];
      const p75Row = p75Values[i];

      // Verify tier is the same
      expect(p75Row.tier).toBe(maxRow.tier);

      // Check if values changed
      if (maxRow.coins !== p75Row.coins || maxRow.cells !== p75Row.cells) {
        foundChange = true;
        break;
      }
    }

    // At least one row should have changed values
    expect(foundChange).toBe(true);
  });
});
