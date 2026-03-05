/**
 * Game Speed Calculation
 *
 * Derives the game speed multiplier from game time and real time.
 * Game speed is a cached property on ParsedGameRun, computed during
 * data import (clipboard paste and CSV import).
 */

/**
 * Calculate game speed (gameTime / realTime) rounded to 3 decimal places.
 * Returns null if realTime is 0 (cannot divide by zero).
 */
export function calculateGameSpeed(gameTime: number, realTime: number): number | null {
  if (realTime === 0) {
    return null
  }
  return Math.round((gameTime / realTime) * 1000) / 1000
}
