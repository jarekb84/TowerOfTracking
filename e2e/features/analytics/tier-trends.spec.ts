import { test, expect } from '../../fixtures/seeded-page';
import { AppPage } from '../../page-objects/app-page';
import { TierTrendsPage } from '../../page-objects/tier-trends-page';

/**
 * Tier Trends E2E Tests
 *
 * High-level smoke test: verify page loads, tier filtering works, field search works, and data displays correctly.
 * Unit tests cover detailed functionality.
 *
 * Uses seededPage fixture which loads localStorage from seed files.
 */

test.describe('Tier Trends', () => {
  test('displays tier trends with filtering and field search', async ({ seededPage }) => {
    const appPage = new AppPage(seededPage);
    const tierTrendsPage = new TierTrendsPage(seededPage);

    // Navigate to tier trends page via sidebar
    await appPage.goto();
    await appPage.tierTrendsLink.click();
    await tierTrendsPage.waitForPageLoad();

    // Select Tier 11 filter
    await tierTrendsPage.selectTier(11);

    // Search for "Coins Earned" field
    await tierTrendsPage.searchField('Coins Earned');

    // Get the last 4 run values for Coins Earned
    const coinsEarnedValues = await tierTrendsPage.getFieldLastNValues('Coins Earned', 4);
    expect(coinsEarnedValues).not.toBeNull();
    expect(coinsEarnedValues?.length).toBe(4);

    // Verify all values are non-empty and contain actual data (should have numbers and units)
    coinsEarnedValues?.forEach((value) => {
      expect(value).toBeTruthy();
      // Values should contain numeric data (T for trillion, B for billion, etc.)
      expect(value).toMatch(/[\d.]+[TBMK]/);
    });
  });
});
