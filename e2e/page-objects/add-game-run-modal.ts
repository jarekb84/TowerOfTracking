import { Page, Locator } from '@playwright/test';

/**
 * Add Game Run Modal Page Object Model
 *
 * Encapsulates interactions with the "Add New Game Run" modal dialog:
 * - Paste from Clipboard button
 * - Import from File button
 * - Game Stats Data textarea
 * - Run Type selector (Farm/Tournament/Milestone)
 * - Date/Time fields
 * - Save button
 *
 * This modal is used for adding individual game runs one at a time.
 */
export class AddGameRunModal {
  readonly page: Page;

  // Modal container - scope all interactions within this
  readonly modal: Locator;

  // Modal elements
  readonly pasteFromClipboardButton: Locator;
  readonly importFromFileButton: Locator;
  readonly gameStatsTextarea: Locator;

  // Run type selector buttons
  readonly farmRunTypeButton: Locator;
  readonly tournamentRunTypeButton: Locator;
  readonly milestoneRunTypeButton: Locator;

  // Save button (at the bottom of the modal)
  readonly saveButton: Locator;

  // Cancel button
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Scope to the modal dialog with the specific heading "Add New Game Run"
    this.modal = page.locator('role=dialog').filter({ hasText: 'Add New Game Run' });

    // Buttons within modal
    this.pasteFromClipboardButton = this.modal.locator('button:has-text("Paste from Clipboard")');
    this.importFromFileButton = this.modal.locator('button:has-text("Import from File")');

    // Textarea for game stats input (scoped to modal)
    // Use the placeholder text to identify the correct textarea
    // (there's also a notes textarea in the modal)
    this.gameStatsTextarea = this.modal.getByRole('textbox', { name: /Paste your game stats/i });

    // Run type selector buttons (within modal)
    this.farmRunTypeButton = this.modal.locator('button:has-text("Farm")');
    this.tournamentRunTypeButton = this.modal.locator('button:has-text("Tournament")');
    this.milestoneRunTypeButton = this.modal.locator('button:has-text("Milestone")');

    // Save and Cancel buttons
    this.saveButton = this.modal.locator('button:has-text("Save")');
    this.cancelButton = this.modal.locator('button:has-text("Cancel")');
  }

  /**
   * Wait for modal to be visible
   */
  async waitForVisible() {
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Paste game stats data into the textarea
   */
  async pasteGameStats(data: string) {
    await this.gameStatsTextarea.fill(data);
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
   * Select run type (Farm, Tournament, or Milestone)
   */
  async selectRunType(runType: 'farm' | 'tournament' | 'milestone') {
    const buttonMap = {
      farm: this.farmRunTypeButton,
      tournament: this.tournamentRunTypeButton,
      milestone: this.milestoneRunTypeButton,
    };

    await buttonMap[runType].click();
  }

  /**
   * Click the Save button to save the game run
   */
  async clickSave() {
    // Wait for button to be enabled (may be disabled initially)
    await this.saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveButton.click();
  }

  /**
   * Click the Cancel button
   */
  async clickCancel() {
    await this.cancelButton.click();
  }

  /**
   * Wait for modal to close (after successful save)
   */
  async waitForClose() {
    await this.modal.waitFor({ state: 'hidden', timeout: 10000 });
  }

  /**
   * Complete add game run flow: paste data + select run type + save + wait for close
   */
  async addGameRun(data: string, runType: 'farm' | 'tournament' | 'milestone') {
    await this.pasteGameStats(data);
    await this.selectRunType(runType);
    await this.clickSave();
    await this.waitForClose();
  }
}
