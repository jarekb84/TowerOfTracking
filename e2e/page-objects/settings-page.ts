import { Page, Locator } from '@playwright/test';
import { BulkImportModal } from './bulk-import-modal';

/**
 * Settings Page Object Model
 *
 * Encapsulates interactions with the Settings page content:
 * - Bulk Import button (opens modal)
 * - Bulk Export button
 * - Data Settings section
 *
 * NOTE: Navigation TO the settings page is handled by AppPage (nav bar deep links).
 * This POM focuses on interactions WITHIN the settings page once you're there.
 */
export class SettingsPage {
  readonly page: Page;

  // Settings page buttons/sections
  readonly bulkImportButton: Locator;
  readonly bulkExportButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Button to open bulk import modal
    this.bulkImportButton = page.locator('button:has-text("Import CSV/TSV")');

    // Button to open bulk export modal/section
    this.bulkExportButton = page.locator('button:has-text("Export CSV")');
  }

  /**
   * Click "Import CSV/TSV" button to open bulk import modal
   * Returns a BulkImportModal instance for further interactions
   */
  async openBulkImportModal(): Promise<BulkImportModal> {
    await this.bulkImportButton.click();

    // Wait for modal to open
    await this.page.locator('text=Import CSV/Tab-Delimited Data').waitFor({ state: 'visible' });

    return new BulkImportModal(this.page);
  }

  /**
   * Click "Export to CSV" button
   */
  async clickBulkExport() {
    await this.bulkExportButton.click();
  }
}
