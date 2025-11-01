import type { ComparisonColumn } from '@/shared/types/game-run.types'

/**
 * Formats a comparison column header for mobile display
 * Handles abbreviation of long headers while preserving essential information
 */
export function formatMobileColumnHeader(header: string): { 
  display: string; 
  abbreviated: boolean; 
} {
  // For per-run data with multi-line header format:
  // Line 1: "T10 6,008" 
  // Line 2: "8hr 43min"
  // Line 3: "8/26 4:23pm"
  if (header.includes('T') && header.includes('hr') && header.includes('min') && header.includes('\n')) {
    const lines = header.split('\n')
    if (lines.length >= 3) {
      // Parse line 1: "T10 6,008" -> extract tier and wave
      const tierWaveMatch = lines[0].match(/T(\d+)\s+([\d,]+)/)
      // Parse line 2: "8hr 43min" -> extract hours
      const durationMatch = lines[1].match(/(\d+)hr/)
      // Parse line 3: "8/26 4:23pm" -> extract date
      const dateMatch = lines[2].match(/(\d{1,2}\/\d{1,2})/)
      
      if (tierWaveMatch && durationMatch && dateMatch) {
        const [, tierNum, waveNum] = tierWaveMatch
        const [, hours] = durationMatch
        const [, date] = dateMatch
        
        // Format: "8/26 T10 4,047 8hr"
        return {
          display: `${date} T${tierNum} ${waveNum} ${hours}hr`,
          abbreviated: false
        }
      }
    }
  }
  
  // For daily headers (e.g., "8/28")
  if (/^\d{1,2}\/\d{1,2}$/.test(header)) {
    return {
      display: header,
      abbreviated: false
    }
  }
  
  // For weekly headers (e.g., "Week of 8/24")
  if (header.startsWith('Week of')) {
    const dateMatch = header.match(/\d{1,2}\/\d{1,2}/)
    return {
      display: dateMatch ? `W ${dateMatch[0]}` : header,
      abbreviated: true
    }
  }
  
  // For monthly headers (e.g., "Aug", "Jul")
  if (/^[A-Za-z]{3,9}$/.test(header)) {
    return {
      display: header.slice(0, 3), // Abbreviate month names to 3 letters
      abbreviated: header.length > 3
    }
  }
  
  // Default: truncate long headers
  if (header.length > 10) {
    return {
      display: header.slice(0, 10) + '...',
      abbreviated: true
    }
  }
  
  return {
    display: header,
    abbreviated: false
  }
}

/**
 * Determines if comparison data should use compact layout
 * Always use single column to maintain comparison flow
 */
export function shouldUseCompactLayout(): boolean {
  // Always use single column layout for better data comparison
  // Users need to scan horizontally to compare values across runs
  return false
}

/**
 * Groups comparison columns for optimal mobile display
 * Returns groups that work well in 2-column mobile layout
 */
export function groupColumnsForMobile(
  comparisonColumns: ComparisonColumn[]
): { left: ComparisonColumn[], right: ComparisonColumn[] } {
  const midpoint = Math.ceil(comparisonColumns.length / 2)
  
  return {
    left: comparisonColumns.slice(0, midpoint),
    right: comparisonColumns.slice(midpoint)
  }
}