import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { CellsAnalyticsPage } from '../../page-objects/cells-analytics-page';

/**
 * Cells Analytics E2E Tests
 *
 * High-level smoke test: verify page loads, chart renders with data, and period switching works.
 * Unit tests cover detailed functionality.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Cells Analytics', () => {
  test('renders chart with data and supports period switching', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const cellsAnalyticsPage = new CellsAnalyticsPage(seededPage);

    // Navigate to cells analytics page via sidebar
    await appPage.goto();
    await appPage.cellAnalyticsLink.click();
    await cellsAnalyticsPage.waitForChartLoad();

    // Verify chart container is visible
    await expect(cellsAnalyticsPage.chartContainer).toBeVisible();

    // Verify chart has data
    const hasData = await cellsAnalyticsPage.hasChartData();
    expect(hasData).toBe(true);

    // Get initial data point count
    const initialDataPoints = await cellsAnalyticsPage.getDataPointCount();
    expect(initialDataPoints).toBeGreaterThan(0);

    // Test period switching - switch to Monthly view (as specified in PRD)
    await cellsAnalyticsPage.switchToMonthly();
    await expect(cellsAnalyticsPage.chartContainer).toBeVisible();

    // Verify chart updated
    const monthlyDataPoints = await cellsAnalyticsPage.getDataPointCount();
    expect(monthlyDataPoints).toBeGreaterThan(0);
  });
});
