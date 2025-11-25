import { Page, Locator } from '@playwright/test';
import { BaseAnalyticsPage } from './base-analytics-page';

/**
 * Field Analytics Page Object Model
 *
 * Extends BaseAnalyticsPage to provide Field Analytics specific functionality:
 * - Field selector dropdown with search functionality
 * - Field selection and switching
 *
 * Inherits from BaseAnalyticsPage:
 * - Time period switching (Hourly, Daily, Weekly, Monthly, Yearly)
 * - Chart rendering verification
 * - Chart data presence validation
 */
export class FieldAnalyticsPage extends BaseAnalyticsPage {
  // Field selector elements (unique to Field Analytics)
  readonly fieldSelectorButton: Locator;
  readonly searchInput: Locator;
  readonly dropdownPanel: Locator;
  readonly chartTitle: Locator;

  constructor(page: Page) {
    super(page);

    // Field selector - button that opens dropdown
    this.fieldSelectorButton = page.locator('button').filter({ hasText: '📊' });

    // Search input in dropdown (appears when dropdown is open)
    this.searchInput = page.locator('input[placeholder="Search fields..."]');

    // Dropdown panel container
    this.dropdownPanel = page.locator('.absolute.z-50').filter({ hasText: 'Showing' });

    // Chart title (in the card)
    this.chartTitle = page.locator('h3').filter({ hasText: 'Over Time' });
  }

  /**
   * Navigate to the Field Analytics page
   * Uses route-based navigation: /charts/fields
   */
  async goto(): Promise<void> {
    await this.page.goto('/charts/fields');
    await this.waitForChartLoad();
  }

  /**
   * Get the currently selected field text from the selector button
   */
  async getSelectedFieldText(): Promise<string> {
    const buttonText = await this.fieldSelectorButton.textContent();
    return buttonText || '';
  }

  /**
   * Open the field selector dropdown
   */
  async openFieldSelector() {
    await this.fieldSelectorButton.click();
    // Wait for search input to be visible
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /**
   * Search for fields using the search input
   * Assumes dropdown is already open
   */
  async searchFields(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    // Small delay for filtering to take effect
    await this.page.waitForTimeout(200);
  }

  /**
   * Select a specific field from the dropdown
   * Assumes dropdown is already open
   */
  async selectField(fieldLabel: string) {
    const fieldButton = this.page.locator('button').filter({ hasText: fieldLabel }).first();
    await fieldButton.click();
    // Wait for dropdown to close
    await this.searchInput.waitFor({ state: 'hidden', timeout: 2000 });
  }
}
