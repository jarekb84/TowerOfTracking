import { Page, Locator } from '@playwright/test';

/**
 * Bulk Export Modal Page Object Model
 *
 * Encapsulates interactions with the bulk export dialog:
 * - Accessing CSV preview textarea
 * - Copying to clipboard
 * - Downloading as file
 * - Closing the dialog
 */
export class BulkExportModal {
  readonly page: Page;

  // Modal elements
  readonly dialogTitle: Locator;
  readonly csvPreviewTextarea: Locator;
  readonly copyToClipboardButton: Locator;
  readonly downloadFileButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Dialog identification
    this.dialogTitle = page.locator('text=Export CSV Data');

    // CSV preview textarea
    this.csvPreviewTextarea = page.locator('textarea[readonly]');

    // Action buttons
    this.copyToClipboardButton = page.locator('button:has-text("Copy to Clipboard")');
    this.downloadFileButton = page.locator('button:has-text("Download File")');
    this.closeButton = page.locator('button:has-text("Close")').last();
  }

  /**
   * Wait for the export modal to be visible
   */
  async waitForModalOpen() {
    await this.dialogTitle.waitFor({ state: 'visible' });
  }

  /**
   * Get the CSV content from the preview textarea
   */
  async getCsvContent(): Promise<string> {
    const content = await this.csvPreviewTextarea.inputValue();
    return content;
  }

  /**
   * Copy CSV content to clipboard
   */
  async copyToClipboard() {
    await this.copyToClipboardButton.click();
    // Wait for success state (button text changes to "Copied!")
    await this.page.locator('button:has-text("Copied!")').waitFor({ state: 'visible', timeout: 2000 });
  }

  /**
   * Download CSV as file
   */
  async downloadFile() {
    // Set up download handler before clicking
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadFileButton.click();
    const download = await downloadPromise;
    return download;
  }

  /**
   * Close the export modal
   */
  async close() {
    await this.closeButton.click();
    // Wait for modal to close
    await this.dialogTitle.waitFor({ state: 'hidden' });
  }
}
