import { Page, Locator } from '@playwright/test';

/**
 * Bulk Import Modal Page Object Model
 *
 * Encapsulates interactions with the CSV/TSV import modal dialog:
 * - Paste from Clipboard button
 * - Import from File button
 * - Data textarea
 * - Import button (the one that says "Import X runs")
 *
 * CRITICAL: This modal has multiple "Import" buttons:
 * 1. "Import from File" - triggers file picker
 * 2. "Import X runs" - actually performs the import (this is the one we want)
 *
 * This POM ensures we always click the correct button.
 */
export class BulkImportModal {
  readonly page: Page;

  // Modal container - scope all interactions within this
  readonly modal: Locator;

  // Modal elements
  readonly pasteFromClipboardButton: Locator;
  readonly importFromFileButton: Locator;
  readonly dataTextarea: Locator;

  // The actual import button (says "Import X runs" where X is the number of runs)
  // This is the button at the bottom of the modal that performs the import
  readonly importButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Scope to the modal dialog with the specific heading
    this.modal = page.locator('role=dialog').filter({ hasText: 'Import CSV/Tab-Delimited Data' });

    // Buttons within modal
    this.pasteFromClipboardButton = this.modal.locator('button:has-text("Paste from Clipboard")');
    this.importFromFileButton = this.modal.locator('button:has-text("Import from File")');

    // Textarea for data input (scoped to modal)
    this.dataTextarea = this.modal.locator('textarea');

    // CRITICAL: Find the "Import" button that says "Import X runs"
    // Use regex to match "Import" followed by optional space and number and "runs"
    // This will match: "Import", "Import 5 runs", "Import 50 runs", etc.
    // We filter by the modal to ensure we don't get other import buttons
    this.importButton = this.modal.locator('button').filter({
      hasText: /Import.*run/i
    }).first();
  }

  /**
   * Wait for modal to be visible
   */
  async waitForVisible() {
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Paste data into the textarea
   */
  async pasteData(data: string) {
    await this.dataTextarea.fill(data);
    // Brief wait for parsing to complete
    await this.page.waitForTimeout(500);
  }

  /**
   * Click "Paste from Clipboard" button
   */
  async clickPasteFromClipboard() {
    await this.pasteFromClipboardButton.click();
  }

  /**
   * Click "Import from File" button (opens file picker)
   */
  async clickImportFromFile() {
    await this.importFromFileButton.click();
  }

  /**
   * Click the main "Import X runs" button to perform the import
   * This is the button that actually imports the data.
   *
   * IMPORTANT: This waits for the button to be enabled before clicking,
   * since the button may be disabled until data is parsed successfully.
   */
  async clickImport() {
    // Wait for button to be enabled (may be disabled initially)
    await this.importButton.waitFor({ state: 'visible', timeout: 10000 });

    // Click with force if needed (sometimes overlays can interfere)
    await this.importButton.click({ force: true });
  }

  /**
   * Wait for modal to close (after successful import)
   */
  async waitForClose() {
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Complete import flow: paste data + click import + wait for close
   */
  async importData(data: string) {
    await this.pasteData(data);
    await this.clickImport();
    await this.waitForClose();
  }
}
