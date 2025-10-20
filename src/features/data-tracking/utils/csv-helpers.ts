/**
 * CSV Helper Utilities
 *
 * Shared utilities for CSV operations across parsing, exporting, and migrations.
 */

/**
 * Auto-detect CSV delimiter from the first line
 *
 * Counts occurrences of tabs, commas, and semicolons, returns the most frequent delimiter.
 * Defaults to tab if counts are equal.
 *
 * @param firstLine - First line of CSV data
 * @returns Detected delimiter (tab, comma, or semicolon)
 *
 * @example
 * detectDelimiter('Name\tAge\tCity') // '\t'
 * detectDelimiter('Name,Age,City') // ','
 * detectDelimiter('Name;Age;City') // ';'
 */
export function detectDelimiter(firstLine: string): string {
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  // Return the delimiter with the highest count (tab is default if tied)
  if (tabCount >= commaCount && tabCount >= semicolonCount) {
    return '\t';
  } else if (commaCount >= semicolonCount) {
    return ',';
  } else {
    return ';';
  }
}
