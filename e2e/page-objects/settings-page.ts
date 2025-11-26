import { Page, Locator } from '@playwright/test';

/**
 * Settings Page Object Model
 *
 * Encapsulates interactions with the Settings tabbed navigation.
 * Settings is now route-based with three tabs:
 * - /settings/import - Import Data page
 * - /settings/export - Export Data page
 * - /settings/delete - Delete Data page
 *
 * NOTE: Navigation TO the settings pages is handled by AppPage (nav bar deep links)
 * or by clicking the tab navigation. Each settings section is now a full page.
 */
export class SettingsPage {
  readonly page: Page;

  // Tab navigation
  readonly importTab: Locator;
  readonly exportTab: Locator;
  readonly deleteTab: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tab navigation links
    this.importTab = page.locator('a[role="tab"]:has-text("Import")');
    this.exportTab = page.locator('a[role="tab"]:has-text("Export")');
    this.deleteTab = page.locator('a[role="tab"]:has-text("Delete")');
  }

  /**
   * Navigate to Import Data tab
   */
  async goToImportTab() {
    await this.importTab.click();
    await this.page.waitForURL(/\/settings\/import/);
  }

  /**
   * Navigate to Export Data tab
   */
  async goToExportTab() {
    await this.exportTab.click();
    await this.page.waitForURL(/\/settings\/export/);
  }

  /**
   * Navigate to Delete Data tab
   */
  async goToDeleteTab() {
    await this.deleteTab.click();
    await this.page.waitForURL(/\/settings\/delete/);
  }
}
