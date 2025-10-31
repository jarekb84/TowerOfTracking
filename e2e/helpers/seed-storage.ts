import { Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Seed Storage Utilities
 *
 * Helpers for extracting and persisting localStorage to seed files
 * for use in E2E test seeding.
 */

/**
 * Extract all localStorage data from the browser page
 */
export async function extractLocalStorage(page: Page): Promise<Record<string, string>> {
  return await page.evaluate(() => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    return data;
  });
}

/**
 * Persist localStorage data to seed files
 *
 * Writes each localStorage key to a separate .seeddata file in e2e/seed/ directory.
 * These files will be used by other E2E tests via the seededPage fixture.
 *
 * @param localStorageData - Key-value pairs from localStorage
 * @param seedDirPath - Optional custom seed directory path (defaults to e2e/seed/)
 * @returns Array of generated seed file names
 */
export async function persistToSeedFiles(
  localStorageData: Record<string, string>,
  seedDirPath?: string
): Promise<string[]> {
  // Default to e2e/seed/ directory relative to this file
  const defaultSeedDir = seedDirPath || path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../seed'
  );

  // Ensure seed directory exists
  await fs.mkdir(defaultSeedDir, { recursive: true });

  // Write each key to separate file
  const seedFiles: string[] = [];
  for (const [key, value] of Object.entries(localStorageData)) {
    const fileName = `${key}.seeddata`;
    await fs.writeFile(
      path.join(defaultSeedDir, fileName),
      value,
      'utf-8'
    );
    seedFiles.push(fileName);
  }

  return seedFiles;
}

/**
 * Load localStorage data from seed files
 *
 * Reads all .seeddata files from the seed directory and returns them as
 * a key-value object ready to be injected into localStorage.
 *
 * @param seedDirPath - Optional custom seed directory path (defaults to e2e/seed/)
 * @returns Key-value pairs to inject into localStorage
 */
export async function loadLocalStorageFromSeedFiles(
  seedDirPath?: string
): Promise<Record<string, string>> {
  // Default to e2e/seed/ directory relative to this file
  const defaultSeedDir = seedDirPath || path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../seed'
  );

  const data: Record<string, string> = {};

  try {
    // Read all .seeddata files
    const files = await fs.readdir(defaultSeedDir);
    const seedFiles = files.filter(file => file.endsWith('.seeddata'));

    for (const fileName of seedFiles) {
      // Remove .seeddata extension to get the localStorage key
      const key = fileName.replace('.seeddata', '');
      const filePath = path.join(defaultSeedDir, fileName);
      const value = await fs.readFile(filePath, 'utf-8');
      data[key] = value;
    }

    console.log(`✓ Loaded ${seedFiles.length} seed files from ${defaultSeedDir}`);
  } catch (error) {
    console.error(`✗ Failed to load seed files from ${defaultSeedDir}:`, error);
    throw error;
  }

  return data;
}

/**
 * Inject localStorage data into the browser page
 *
 * Sets localStorage items from the provided key-value pairs.
 * Must be called before navigating to the page that needs the data.
 *
 * @param page - Playwright page object
 * @param data - Key-value pairs to inject into localStorage
 */
export async function injectLocalStorage(
  page: Page,
  data: Record<string, string>
): Promise<void> {
  await page.evaluate((storageData) => {
    for (const [key, value] of Object.entries(storageData)) {
      localStorage.setItem(key, value);
    }
  }, data);
}

/**
 * Complete seeding workflow: extract localStorage and persist to files
 *
 * Convenience method that combines extraction and persistence.
 *
 * @param page - Playwright page object
 * @param seedDirPath - Optional custom seed directory path
 * @returns Array of generated seed file names
 */
export async function seedLocalStorageToFiles(
  page: Page,
  seedDirPath?: string
): Promise<string[]> {
  const localStorageData = await extractLocalStorage(page);
  const seedFiles = await persistToSeedFiles(localStorageData, seedDirPath);

  console.log(`✓ Generated ${seedFiles.length} seed files:`, seedFiles.join(', '));

  return seedFiles;
}
