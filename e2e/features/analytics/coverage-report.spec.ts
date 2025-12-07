import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { CoverageReportPage } from '../../page-objects/coverage-report-page';

/**
 * Coverage Report E2E Test
 *
 * Single happy-path test that verifies:
 * - Page loads and renders charts
 * - Duration filter switching works
 * - Timeline chart tooltip shows real data on hover
 * - Death Wave metric appears with correct percentage value
 */

test.describe('Coverage Report', () => {
  test('loads page, switches to monthly, and shows tooltip with coverage data', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const coverageReportPage = new CoverageReportPage(seededPage);

    // Step 1: Navigate to Coverage Report page via sidebar
    await appPage.goto();
    await appPage.coverageReportLink.click();
    await coverageReportPage.waitForChartLoad();

    // Step 2: Verify chart container is visible
    await expect(coverageReportPage.chartContainer).toBeVisible();

    // Step 3: Switch to Monthly duration
    await coverageReportPage.switchToMonthly();

    // Step 4: Hover over a month label on the timeline chart (monthly view shows "Oct '25" format)
    await coverageReportPage.hoverOverChartLabel("Oct '25");

    // Step 5: Verify tooltip appears with Death Wave and specific percentage value
    const tooltipContent = await coverageReportPage.getTooltipContent();
    expect(tooltipContent).toBeTruthy();
    expect(tooltipContent).toContain('Death Wave');
    expect(tooltipContent).toContain('13.2%'); // Death Wave coverage percentage for Oct '25
  });
});
