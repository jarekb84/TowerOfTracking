import { Page, Locator } from '@playwright/test';

/**
 * App Page Object Model
 *
 * Encapsulates interactions with app-wide elements:
 * - Header navigation
 * - Sidebar navigation (nav bar with deep links)
 * - Add Game Run button (in header)
 *
 * The nav bar owns direct links to features, including settings deep links.
 * Used across multiple tests for consistent navigation.
 */
export class AppPage {
  readonly page: Page;

  // Header elements
  readonly addGameRunButton: Locator;

  // Sidebar navigation - Main sections
  readonly farmRunsLink: Locator;
  readonly tournamentRunsLink: Locator;
  readonly milestoneRunsLink: Locator;

  // Sidebar navigation - Charts section
  readonly coinAnalyticsLink: Locator;
  readonly cellAnalyticsLink: Locator;
  readonly fieldAnalyticsLink: Locator;
  readonly deathAnalyticsLink: Locator;
  readonly tierStatsLink: Locator;
  readonly tierTrendsLink: Locator;
  readonly sourceAnalysisLink: Locator;

  // Sidebar navigation - Settings section (deep links to settings page)
  readonly bulkImportLink: Locator;
  readonly bulkExportLink: Locator;
  readonly deleteDataLink: Locator;

  // Sidebar navigation - Community section
  readonly joinDiscordLink: Locator;
  readonly viewSourceLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.addGameRunButton = page.locator('button:has-text("Add Game Run")');

    // Main sections
    this.farmRunsLink = page.locator('a:has-text("Farm Runs")');
    this.tournamentRunsLink = page.locator('a:has-text("Tournament Runs")');
    this.milestoneRunsLink = page.locator('a:has-text("Milestone Runs")');

    // Charts section
    this.coinAnalyticsLink = page.locator('a:has-text("Coin Analytics")');
    this.cellAnalyticsLink = page.locator('a:has-text("Cell Analytics")');
    this.fieldAnalyticsLink = page.locator('a:has-text("Field Analytics")');
    this.deathAnalyticsLink = page.locator('a:has-text("Death Analytics")');
    this.tierStatsLink = page.locator('a:has-text("Tier Stats")');
    this.tierTrendsLink = page.locator('a:has-text("Tier Trends")');
    this.sourceAnalysisLink = page.locator('a:has-text("Source Analysis")');

    // Settings section (deep links to settings page)
    this.bulkImportLink = page.locator('a:has-text("Bulk Import")');
    this.bulkExportLink = page.locator('a:has-text("Bulk Export")');
    this.deleteDataLink = page.locator('a:has-text("Delete Data")');

    // Community section
    this.joinDiscordLink = page.locator('a:has-text("Join Discord")');
    this.viewSourceLink = page.locator('a:has-text("View Source")');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Navigate to specific route directly
   */
  async gotoRoute(route: string) {
    await this.page.goto(route);
  }

  /**
   * Navigate to Farm Runs page via sidebar
   * Uses route-based navigation: /runs/farm
   */
  async navigateToFarmRuns() {
    await this.farmRunsLink.click();
    await this.page.waitForURL(/\/runs\/farm/);
  }

  /**
   * Navigate to Tournament Runs page via sidebar
   * Uses route-based navigation: /runs/tournament
   */
  async navigateToTournamentRuns() {
    await this.tournamentRunsLink.click();
    await this.page.waitForURL(/\/runs\/tournament/);
  }

  /**
   * Navigate to Milestone Runs page via sidebar
   * Uses route-based navigation: /runs/milestone
   */
  async navigateToMilestoneRuns() {
    await this.milestoneRunsLink.click();
    await this.page.waitForURL(/\/runs\/milestone/);
  }

  /**
   * Navigate to Bulk Import (deep link to settings page)
   * This clicks the nav bar link and waits for settings page to load
   */
  async navigateToBulkImport() {
    await this.bulkImportLink.click();
    // Settings page loads, and should scroll to/focus bulk import section
    await this.page.waitForURL(/\/settings/);
  }

  /**
   * Navigate to Bulk Export (deep link to settings page)
   */
  async navigateToBulkExport() {
    await this.bulkExportLink.click();
    await this.page.waitForURL(/\/settings/);
  }

  /**
   * Navigate to Delete Data (deep link to settings page)
   */
  async navigateToDeleteData() {
    await this.deleteDataLink.click();
    await this.page.waitForURL(/\/settings/);
  }

  /**
   * Click Add Game Run button (opens modal)
   */
  async clickAddGameRun() {
    await this.addGameRunButton.click();
  }

  /**
   * Dismiss notification toast if visible
   * Used to clear initial notifications that might interfere with tests
   */
  async dismissNotificationIfVisible() {
    const dismissButton = this.page.locator('button:has-text("Dismiss")');
    const isVisible = await dismissButton.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await dismissButton.click();
    }
  }
}
