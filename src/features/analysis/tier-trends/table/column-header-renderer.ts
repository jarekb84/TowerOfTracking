/**
 * Pure functions for rendering table column headers
 */

/**
 * Parses a header string and returns structured data for rendering
 */
export function parseColumnHeader(header: string): { lines: string[]; isMultiLine: boolean } {
  const lines = header.split('\n')
  return {
    lines,
    isMultiLine: lines.length > 1
  }
}

/**
 * Gets the CSS classes for a specific line in a multi-line header
 * @param lineIndex The index of the current line (0-based)
 * @param totalLines The total number of lines in the header
 */
export function getHeaderLineClasses(lineIndex: number, totalLines: number): string {
  const baseClasses = 'whitespace-nowrap'
  
  // Handle single-line or edge cases
  if (totalLines <= 1) {
    return baseClasses
  }
  
  // For multi-line headers, apply different styling per line
  switch (lineIndex) {
    case 0:
      return `${baseClasses} font-bold text-base`
    case 1:
      return `${baseClasses} font-normal text-sm`
    default:
      return `${baseClasses} font-normal text-xs text-slate-400`
  }
}

/**
 * Determines if the header should be rendered as multi-line
 */
export function isMultiLineHeader(header: string): boolean {
  return header.includes('\n')
}