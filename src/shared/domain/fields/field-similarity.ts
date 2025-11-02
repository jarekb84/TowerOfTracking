/**
 * Field Similarity Detection
 *
 * Utilities for detecting similar field names to help users identify
 * potential mapping issues or typos in their imported data.
 */

/**
 * Result of field similarity check
 */
interface FieldSimilarityResult {
  /** Whether the fields are similar enough to warrant a suggestion */
  similar: boolean;
  /** The existing field that matches (if similar is true) */
  suggestion?: string;
  /** Type of similarity detected */
  type?: 'exact' | 'normalized' | 'levenshtein' | 'case-variation';
  /** Similarity score (0-1, where 1 is identical) */
  score?: number;
}

/**
 * Classification of field status
 */
interface FieldClassification {
  /** The imported field name */
  fieldName: string;
  /** Status of this field */
  status: 'exact-match' | 'new-field' | 'similar-field';
  /** If similar-field, what is the suggested match */
  similarTo?: string;
  /** Type of similarity if status is 'similar-field' */
  similarityType?: FieldSimilarityResult['type'];
  /** Whether this is an internal field (starts with _) */
  isInternal: boolean;
}

/**
 * Normalize a string for comparison by:
 * - Converting to lowercase
 * - Removing all spaces, underscores, hyphens
 * - Trimming whitespace
 *
 * Examples:
 * - "Coins Earned" → "coinsearned"
 * - "coins_earned" → "coinsearned"
 * - "coinsEarned" → "coinsearned"
 */
export function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/[\s_-]/g, '')
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into another.
 *
 * Examples:
 * - levenshteinDistance("kitten", "sitting") → 3
 * - levenshteinDistance("saturday", "sunday") → 3
 * - levenshteinDistance("coins", "couns") → 1
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column (deletions from str1)
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }

  // Initialize first row (insertions to str1)
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // Deletion
        matrix[i][j - 1] + 1,      // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Check if two field names are case variations of each other
 * (e.g., camelCase vs snake_case vs "Title Case")
 *
 * Examples:
 * - "coinsEarned" and "coins_earned" → true
 * - "coinsEarned" and "Coins Earned" → true
 * - "coinsEarned" and "totalWaves" → false
 */
export function areCaseVariations(field1: string, field2: string): boolean {
  const normalized1 = normalizeFieldName(field1);
  const normalized2 = normalizeFieldName(field2);
  return normalized1 === normalized2;
}

/**
 * Check if an imported field is similar to any existing field
 *
 * Similarity checks (in order of precedence):
 * 1. Exact match (case-insensitive) → not similar, it's exact
 * 2. Normalized match (remove spaces/underscores/case) → similar
 * 3. Levenshtein distance < threshold → similar
 *
 * Note: Case variation is detected by the normalized match check.
 *
 * @param importedField - The field name from the import
 * @param existingFields - Array of field names already in the system
 * @param levenshteinThreshold - Maximum Levenshtein distance to consider similar (default: 3)
 * @returns Similarity result with suggestion if similar
 */
export function checkFieldSimilarity(
  importedField: string,
  existingFields: string[],
  levenshteinThreshold: number = 3
): FieldSimilarityResult {
  const importedLower = importedField.toLowerCase();
  const importedNormalized = normalizeFieldName(importedField);

  for (const existingField of existingFields) {
    const existingLower = existingField.toLowerCase();
    const existingNormalized = normalizeFieldName(existingField);

    // Check 1: Exact match (case-insensitive)
    if (importedLower === existingLower) {
      return {
        similar: false, // It's an exact match, not just similar
        suggestion: existingField,
        type: 'exact',
        score: 1.0
      };
    }

    // Check 2: Normalized match (spaces/underscores/hyphens removed)
    // This also catches case variations like camelCase vs snake_case
    if (importedNormalized === existingNormalized) {
      // Determine if it's specifically a case variation or has other differences
      const isCaseVariation = areCaseVariations(importedField, existingField);
      return {
        similar: true,
        suggestion: existingField,
        type: isCaseVariation ? 'case-variation' : 'normalized',
        score: 0.95
      };
    }

    // Check 3: Levenshtein distance (only check if normalized didn't match)
    const distance = levenshteinDistance(importedNormalized, existingNormalized);
    if (distance > 0 && distance <= levenshteinThreshold) {
      // Calculate similarity score (closer to 1 = more similar)
      const maxLen = Math.max(importedNormalized.length, existingNormalized.length);
      const score = 1 - (distance / maxLen);

      // Only suggest if score is high enough (> 0.85 = 85% similar)
      // This prevents false positives like "Death Wave Damage" vs "Death Ray Damage"
      if (score > 0.85) {
        return {
          similar: true,
          suggestion: existingField,
          type: 'levenshtein',
          score
        };
      }
    }
  }

  return { similar: false };
}

/**
 * Classify multiple imported fields against existing fields
 *
 * @param importedFields - Array of field names from the import
 * @param existingFields - Array of field names already in the system
 * @param levenshteinThreshold - Maximum Levenshtein distance to consider similar
 * @returns Array of field classifications
 */
export function classifyFields(
  importedFields: string[],
  existingFields: string[],
  levenshteinThreshold: number = 3
): FieldClassification[] {
  return importedFields.map(fieldName => {
    const isInternal = fieldName.startsWith('_');
    const similarityResult = checkFieldSimilarity(fieldName, existingFields, levenshteinThreshold);

    if (similarityResult.type === 'exact') {
      return {
        fieldName,
        status: 'exact-match',
        isInternal
      };
    }

    if (similarityResult.similar && similarityResult.suggestion) {
      return {
        fieldName,
        status: 'similar-field',
        similarTo: similarityResult.suggestion,
        similarityType: similarityResult.type,
        isInternal
      };
    }

    return {
      fieldName,
      status: 'new-field',
      isInternal
    };
  });
}
