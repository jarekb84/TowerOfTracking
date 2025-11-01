import type { FieldTrendData } from '@/features/analysis/tier-trends/types';

/**
 * Filter field trends based on search term using case-insensitive substring matching
 */
export function filterFieldTrends(
  trends: FieldTrendData[],
  searchTerm: string
): FieldTrendData[] {
  const trimmedTerm = normalizeSearchTerm(searchTerm);
  
  if (trimmedTerm.length < 2) {
    return trends;
  }
  
  return trends.filter(trend => 
    matchesFieldName(trend, trimmedTerm)
  );
}

/**
 * Normalize search term for consistent matching
 */
export function normalizeSearchTerm(term: string): string {
  return term.trim().toLowerCase();
}

/**
 * Check if field trend matches search term
 */
export function matchesFieldName(trend: FieldTrendData, searchTerm: string): boolean {
  const normalizedTerm = normalizeSearchTerm(searchTerm);
  const fieldNameLower = trend.fieldName.toLowerCase();
  const displayNameLower = trend.displayName.toLowerCase();
  
  return fieldNameLower.includes(normalizedTerm) || 
         displayNameLower.includes(normalizedTerm);
}

/**
 * Validate search term length for minimum character requirement
 */
export function isValidSearchTerm(term: string): boolean {
  return normalizeSearchTerm(term).length >= 2;
}