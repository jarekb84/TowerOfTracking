import { describe, expect, it } from 'vitest';
import type { GameRunField } from '@/shared/types/game-run.types';
import { applyDerivations, cascadeFromInputChange } from './apply-derivations';
import { appGraph } from '../../../app-graph';

// Behavior tests for the cascade walker, invoked against the production
// catalog (which declares _date / _time / _runType derivations). Pure
// `Record<string, GameRunField>` in, same shape out — no React, no UI.

function gameField(originalKey: string, rawValue: string, value: unknown, dataType: GameRunField['dataType']): GameRunField {
  return { value: value as GameRunField['value'], rawValue, displayValue: rawValue, originalKey, dataType };
}

describe('applyDerivations against the production catalog', () => {
  it('derives _date and _time from battleReport_battleDate', () => {
    const battleDate = new Date('2025-10-14T13:14:00');
    const fields: Record<string, GameRunField> = {
      battleReport_battleDate: gameField('Battle Date', 'Oct 14, 2025 13:14', battleDate, 'date'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._date?.rawValue).toBe('2025-10-14');
    expect(result._date?.dataType).toBe('date');
    expect(result._time?.rawValue).toBe('13:14:00');
    expect(result._time?.dataType).toBe('string');
  });

  it('preserves explicit _date / _time when both they and battleReport_battleDate are present', () => {
    // At parse time, an explicit import column wins over the battleDate-
    // derived value (legacy behavior). Edit-time cascade
    // (`cascadeFromInputChange`) is the path that overrides.
    const battleDate = new Date('2025-10-14T13:14:00');
    const fields: Record<string, GameRunField> = {
      battleReport_battleDate: gameField('Battle Date', 'Oct 14, 2025 13:14', battleDate, 'date'),
      _date: gameField('_date', '1999-01-01', '1999-01-01', 'date'),
      _time: gameField('_time', '00:00:00', '00:00:00', 'string'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._date.rawValue).toBe('1999-01-01');
    expect(result._time.rawValue).toBe('00:00:00');
  });

  it('skips date / time derivation when battleReport_battleDate is absent', () => {
    const fields: Record<string, GameRunField> = {
      battleReport_tier: gameField('Tier', '10', 10, 'tier'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._date).toBeUndefined();
    expect(result._time).toBeUndefined();
  });

  it('derives _runType tournament from a tier-`+` value when no explicit _runType exists', () => {
    const fields: Record<string, GameRunField> = {
      battleReport_tier: gameField('Tier', '10+', 10, 'tier'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._runType?.rawValue).toBe('tournament');
  });

  it('leaves _runType unset for a plain tier value when no explicit _runType exists', () => {
    const fields: Record<string, GameRunField> = {
      battleReport_tier: gameField('Tier', '10', 10, 'tier'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._runType).toBeUndefined();
  });

  it('preserves an explicit _runType over the tier-derived fallback', () => {
    const fields: Record<string, GameRunField> = {
      battleReport_tier: gameField('Tier', '10+', 10, 'tier'),
      _runType: gameField('_runType', 'milestone', 'milestone', 'string'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._runType.rawValue).toBe('milestone');
  });

  it('treats an invalid explicit _runType as derivable and falls back to tier', () => {
    const fields: Record<string, GameRunField> = {
      battleReport_tier: gameField('Tier', '10+', 10, 'tier'),
      _runType: gameField('_runType', 'invalid-value', 'invalid-value', 'string'),
    };

    const result = applyDerivations(appGraph(), fields);

    expect(result._runType.rawValue).toBe('tournament');
  });
});

describe('cascadeFromInputChange', () => {
  it('refreshes _date and _time when battleReport_battleDate is edited', () => {
    const newDate = new Date('2025-12-25T10:30:00');
    const fields: Record<string, GameRunField> = {
      battleReport_battleDate: gameField('Battle Date', 'Dec 25, 2025 10:30', newDate, 'date'),
      _date: gameField('_date', '1999-01-01', '1999-01-01', 'date'),
      _time: gameField('_time', '00:00:00', '00:00:00', 'string'),
      _runType: gameField('_runType', 'farm', 'farm', 'string'),
    };

    const result = cascadeFromInputChange(appGraph(), fields, 'battleReport_battleDate');

    expect(result._date.rawValue).toBe('2025-12-25');
    expect(result._time.rawValue).toBe('10:30:00');
    expect(result._runType.rawValue).toBe('farm');
  });

  it('does nothing when the changed field has no downstream derivations', () => {
    const fields: Record<string, GameRunField> = {
      _notes: gameField('_notes', 'hi', 'hi', 'string'),
    };

    const result = cascadeFromInputChange(appGraph(), fields, '_notes');

    expect(result).toStrictEqual(fields);
  });
});
