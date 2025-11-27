import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { SourceAnalysisPage } from '../../page-objects/source-analysis-page';

/**
 * Source Analysis E2E Test
 *
 * Single happy-path test that verifies:
 * - Page loads and renders charts
 * - Duration filter switching works
 * - Timeline chart tooltip shows real data on hover
 * - Source Ranking bar chart displays real source data with values and percentages
 */

test.describe('Source Analysis', () => {
  test('loads page, switches to monthly, shows tooltip, and renders source ranking with real data', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const sourceAnalysisPage = new SourceAnalysisPage(seededPage);

    // Step 1: Navigate to Source Analysis page via sidebar
    await appPage.goto();
    await appPage.sourceAnalysisLink.click();
    await sourceAnalysisPage.waitForChartLoad();

    // Step 2: Verify chart container is visible
    await expect(sourceAnalysisPage.chartContainer).toBeVisible();

    // Step 3: Switch to Monthly duration to get aggregated data
    await sourceAnalysisPage.switchToMonthly();

    // Step 4: Hover over Oct 25 on the timeline chart to trigger tooltip
    await sourceAnalysisPage.hoverOverChartLabel('Oct 25');

    // Step 5: Verify tooltip appears with real data content
    const tooltipContent = await sourceAnalysisPage.getTooltipContent();
    expect(tooltipContent).toBeTruthy();
    expect(tooltipContent).toContain('Chain Lightning');

    // Step 6: Verify Source Ranking bar chart shows real source data
    const sourceRankingContent = await sourceAnalysisPage.getSourceRankingContent();
    expect(sourceRankingContent).toBeTruthy();

    // Verify specific source appears with its value and percentage
    // Chain Lightning is the top damage source in the seed data
    expect(sourceRankingContent).toContain('Chain Lightning');
    expect(sourceRankingContent).toContain('2.9S'); // ~2.9 sextillion damage
    expect(sourceRankingContent).toContain('56%'); // Top source percentage
  });
});
