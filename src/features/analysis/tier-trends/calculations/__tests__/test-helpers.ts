import type { ParsedGameRun, GameRunField } from '@/shared/types/game-run.types';

/**
 * Helper function to create a mock field
 */
export function createMockField(
  value: number | string | Date,
  dataType: GameRunField['dataType'],
  originalKey: string
): GameRunField {
  return {
    value,
    rawValue: String(value),
    displayValue: String(value),
    originalKey,
    dataType,
  };
}

/**
 * Helper function to create a mock ParsedGameRun for testing
 */
export function createMockRun(
  overrides: Partial<ParsedGameRun> = {},
  timestamp?: Date,
  tier: number = 1
): ParsedGameRun {
  const baseFields: Record<string, GameRunField> = {
    coinsEarned: createMockField(1000, 'number', 'Coins Earned'),
    cellsEarned: createMockField(500, 'number', 'Cells Earned'),
    wave: createMockField(10, 'number', 'Wave'),
    realTime: createMockField(1800, 'duration', 'Real Time'),
    gameTime: createMockField(3600, 'duration', 'Game Time'),
    tier: createMockField(String(tier), tier > 7 ? 'string' : 'number', 'Tier'),
  };

  return {
    id: crypto.randomUUID(),
    timestamp: timestamp || new Date('2024-01-01T12:00:00Z'),
    fields: { ...baseFields, ...overrides.fields },
    tier,
    wave: 10,
    coinsEarned: 1000,
    cellsEarned: 500,
    realTime: 1800,
    runType: 'farm',
    ...overrides,
  };
}

/**
 * Helper function to create runs with varying data
 */
export function createRunsWithVariation(count: number, tier: number = 1): ParsedGameRun[] {
  const runs: ParsedGameRun[] = [];
  const baseTime = new Date('2024-01-01T12:00:00Z');

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(baseTime.getTime() + (i * 60 * 60 * 1000)); // 1 hour apart
    const multiplier = 1 + (i * 0.1); // Increasing values

    runs.push(createMockRun({
      timestamp,
      fields: {
        coinsEarned: createMockField(1000 * multiplier, 'number', 'Coins Earned'),
        cellsEarned: createMockField(500 * multiplier, 'number', 'Cells Earned'),
        wave: createMockField(10 + i, 'number', 'Wave'),
        realTime: createMockField(1800 * multiplier, 'duration', 'Real Time'),
        gameTime: createMockField(3600 * multiplier, 'duration', 'Game Time'),
        tier: createMockField(String(tier), 'number', 'Tier'),
      },
      tier,
      coinsEarned: 1000 * multiplier,
      cellsEarned: 500 * multiplier,
      wave: 10 + i,
      realTime: 1800 * multiplier,
    }, timestamp, tier));
  }

  return runs;
}
