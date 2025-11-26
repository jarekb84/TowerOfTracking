import { Page, Locator } from '@playwright/test';

/**
 * Export Page Object Model
 *
 * Encapsulates interactions with the /settings/export page:
 * - CSV preview textarea (readonly)
 * - Copy to Clipboard button
 * - Download File button
 *
 * This is a full page, not a modal. The export content is displayed
 * directly on the page at /settings/export.
 */
export class ExportPage {
  readonly page: Page;

  // Page elements
  readonly csvPreviewTextarea: Locator;
  readonly copyButton: Locator;
  readonly downloadButton: Locator;

  // Empty state indicator
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    // Textarea for CSV preview (readonly)
    this.csvPreviewTextarea = page.locator('textarea');

    // Copy to clipboard button
    this.copyButton = page.locator('button:has-text("Copy to Clipboard")');

    // Download button
    this.downloadButton = page.locator('button:has-text("Download")');

    // Empty state when no data to export
    this.emptyState = page.locator('text=No Data to Export');
  }

  /**
   * Wait for page to be loaded and CSV to be generated
   */
  async waitForPageLoad() {
    // Wait for either the textarea (with data) or empty state (no data)
    await this.page.waitForSelector('textarea, :text("No Data to Export")', { timeout: 10000 });
    // Give time for CSV generation if there's data
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the CSV content from the preview textarea
   */
  async getCsvContent(): Promise<string> {
    await this.csvPreviewTextarea.waitFor({ state: 'visible', timeout: 10000 });
    const value = await this.csvPreviewTextarea.inputValue();
    return value;
  }

  /**
   * Click the copy to clipboard button
   */
  async clickCopyToClipboard() {
    await this.copyButton.waitFor({ state: 'visible' });
    await this.copyButton.click();
  }

  /**
   * Click the download button
   */
  async clickDownload() {
    await this.downloadButton.waitFor({ state: 'visible' });
    await this.downloadButton.click();
  }

  /**
   * Check if there's data to export
   */
  async hasData(): Promise<boolean> {
    const emptyStateVisible = await this.emptyState.isVisible().catch(() => false);
    return !emptyStateVisible;
  }
}
