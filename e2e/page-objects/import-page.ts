import { Page, Locator } from '@playwright/test';

/**
 * Import Page Object Model
 *
 * Encapsulates interactions with the /settings/import page:
 * - Paste from Clipboard button
 * - Import from File button
 * - Data textarea
 * - Import button (the one that says "Import X runs")
 * - Clear button
 *
 * This is a full page, not a modal. The import content is displayed
 * directly on the page at /settings/import.
 */
export class ImportPage {
  readonly page: Page;

  // Page elements
  readonly pasteFromClipboardButton: Locator;
  readonly importFromFileButton: Locator;
  readonly dataTextarea: Locator;
  readonly clearButton: Locator;

  // The actual import button (says "Import X runs" where X is the number of runs)
  // Located in the sticky footer at the bottom of the page
  readonly importButton: Locator;

  // Success alert that appears after successful import
  readonly successAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // Buttons on the page
    this.pasteFromClipboardButton = page.locator('button:has-text("Paste from Clipboard")');
    this.importFromFileButton = page.locator('button:has-text("Import from File")');

    // Textarea for data input
    this.dataTextarea = page.locator('textarea');

    // Clear button in sticky footer
    this.clearButton = page.locator('button:has-text("Clear")');

    // Import button in sticky footer - matches "Import X runs" pattern
    this.importButton = page.locator('button').filter({
      hasText: /Import.*run/i
    }).first();

    // Success alert after import - look for the InfoBox title
    this.successAlert = page.locator('text=Import Successful');
  }

  /**
   * Wait for page to be loaded and React hydration to complete
   */
  async waitForPageLoad() {
    await this.dataTextarea.waitFor({ state: 'visible', timeout: 10000 });
    // Wait for React hydration to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Paste data into the textarea
   */
  async pasteData(data: string) {
    // Ensure textarea is ready for input
    await this.dataTextarea.waitFor({ state: 'visible' });

    // Clear any existing content first
    await this.dataTextarea.click();
    await this.dataTextarea.clear();

    // Use fill which triggers React's onChange
    await this.dataTextarea.fill(data);

    // Wait for parsing to complete and UI to update (parsing can take a moment for large files)
    await this.page.waitForTimeout(2000);
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
   *
   * IMPORTANT: This waits for the button to be enabled before clicking,
   * since the button may be disabled until data is parsed successfully.
   */
  async clickImport() {
    // Wait for button to be visible in the sticky footer
    await this.importButton.waitFor({ state: 'visible', timeout: 10000 });

    // Click the import button (don't add delays - we need to catch the success message quickly)
    await this.importButton.click();
  }

  /**
   * Wait for success alert after import.
   * The success message only shows for 3 seconds, so we need to catch it quickly.
   */
  async waitForImportSuccess() {
    await this.successAlert.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Wait for import to complete by checking if the sticky footer disappears
   * (indicating the form was cleared after successful import)
   */
  async waitForImportComplete() {
    // After successful import in page mode, the form clears and the sticky footer disappears
    await this.importButton.waitFor({ state: 'hidden', timeout: 15000 });
  }

  /**
   * Complete import flow: paste data + click import + wait for success
   */
  async importData(data: string) {
    await this.pasteData(data);
    await this.clickImport();

    // Try to catch the success message, but if we miss it (3 second window),
    // fall back to checking that the form was cleared (footer disappears)
    try {
      await this.successAlert.waitFor({ state: 'visible', timeout: 3000 });
    } catch {
      // Success message may have already disappeared - check form was cleared instead
      await this.waitForImportComplete();
    }
  }

  /**
   * Click clear button to reset form
   */
  async clickClear() {
    await this.clearButton.click();
  }
}
