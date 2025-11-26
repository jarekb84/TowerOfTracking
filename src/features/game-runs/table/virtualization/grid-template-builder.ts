import type { Header } from '@tanstack/react-table';

/**
 * Column IDs that should have fixed widths (no flex growth).
 * These are icon/action columns that should not expand with available space.
 */
const FIXED_WIDTH_COLUMN_IDS = new Set(['expander', 'notes', 'actions']);

/**
 * Checks if a column should have a fixed width (no flex growth).
 */
export function isFixedWidthColumn(columnId: string): boolean {
  return FIXED_WIDTH_COLUMN_IDS.has(columnId);
}

/**
 * Builds a CSS Grid template columns string from table headers.
 *
 * Fixed columns (expander, notes, actions) get exact pixel sizes.
 * Content columns get minmax(min, 1fr) for flexible distribution.
 *
 * @param headers - Array of TanStack Table header objects
 * @returns CSS grid-template-columns string
 *
 * @example
 * // Returns "40px minmax(105px, 1fr) minmax(85px, 1fr) 40px"
 * buildGridTemplateColumns(headers);
 */
export function buildGridTemplateColumns<TData>(
  headers: Header<TData, unknown>[]
): string {
  return headers
    .map((header) => {
      const width = header.getSize();
      if (isFixedWidthColumn(header.id)) {
        return `${width}px`; // Fixed size, no flex growth
      }
      return `minmax(${width}px, 1fr)`; // Flexible, shares extra space
    })
    .join(' ');
}
