import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { FieldAnalyticsPage } from '../../page-objects/field-analytics-page';

/**
 * Field Analytics E2E Tests
 *
 * High-level smoke test: verify page loads with default field selection,
 * field selector dropdown works with search, field switching updates chart,
 * and period switching works.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Field Analytics', () => {
  test('loads page, supports field selection with search, and period switching', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const fieldAnalyticsPage = new FieldAnalyticsPage(seededPage);

    // Step 1: Navigate to Field Analytics page via sidebar
    await appPage.goto();
    await appPage.fieldAnalyticsLink.click();
    await fieldAnalyticsPage.waitForChartLoad();

    // Step 2: Verify initial state - chart container visible with default field
    await expect(fieldAnalyticsPage.chartContainer).toBeVisible();

    // Verify default field selection (should be "Reroll Shards Earned")
    const selectedFieldText = await fieldAnalyticsPage.getSelectedFieldText();
    expect(selectedFieldText).toContain('Reroll Shards Earned');

    // Verify chart has data
    const hasData = await fieldAnalyticsPage.hasChartData();
    expect(hasData).toBe(true);

    // Step 3: Open field selector and search for "golden tower"
    await fieldAnalyticsPage.openFieldSelector();

    // Verify dropdown is visible with search input
    await expect(fieldAnalyticsPage.searchInput).toBeVisible();

    // Type fuzzy search query
    await fieldAnalyticsPage.searchFields('golden tower');

    // Step 4: Select "Coins From Golden Tower" from filtered results
    await fieldAnalyticsPage.selectField('Coins From Golden Tower');

    // Verify dropdown closes and selection updates
    const newSelectedField = await fieldAnalyticsPage.getSelectedFieldText();
    expect(newSelectedField).toContain('Coins From Golden Tower');

    // Wait for chart to update
    await fieldAnalyticsPage.waitForChartLoad();

    // Verify chart container is still visible after field change
    await expect(fieldAnalyticsPage.chartContainer).toBeVisible();

    // Step 5: Switch to Daily period
    await fieldAnalyticsPage.switchToDaily();

    // Verify chart updates and has data
    await expect(fieldAnalyticsPage.chartContainer).toBeVisible();
    const dailyDataPoints = await fieldAnalyticsPage.getDataPointCount();
    expect(dailyDataPoints).toBeGreaterThan(0);

    // Step 6: Switch to Monthly period
    await fieldAnalyticsPage.switchToMonthly();

    // Verify chart updates and has data
    await expect(fieldAnalyticsPage.chartContainer).toBeVisible();
    const monthlyDataPoints = await fieldAnalyticsPage.getDataPointCount();
    expect(monthlyDataPoints).toBeGreaterThan(0);

    // Step 7: Verify tooltip appears on hover over September 2025
    await fieldAnalyticsPage.hoverOverChartLabel('Sep 2025');

    // Get tooltip content and verify it contains the field name
    const tooltipContent = await fieldAnalyticsPage.getTooltipContent();
    expect(tooltipContent).toBeTruthy();
    expect(tooltipContent).toContain('Coins From Golden Tower');
  });
});
