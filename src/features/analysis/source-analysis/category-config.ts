/**
 * Category Configuration for Source Analysis
 *
 * Source-analysis pages render two breakdown categories (damage dealt, coin
 * income). The source field list, display names, and colors all come from
 * the field graph — the only thing this file owns is the user-facing
 * category metadata (id, friendly description, default selection).
 */

import {
  BATTLE_REPORT__COINS_EARNED_NODE,
  DAMAGE__DAMAGE_DEALT_NODE,
} from '@/shared/domain/field-graph/catalog/fields.nodes';
import {
  colorOf,
  displayNameOf,
  sourcesOf,
} from '@/shared/domain/field-graph';
import type { CategoryDefinition, SourceCategory, SourceFieldDefinition } from './types';

export interface GradientConfig {
  id: string;
  startColor: string;
  startOpacity: number;
  endColor: string;
  endOpacity: number;
}

export function getGradientConfig(fieldName: string, color: string): GradientConfig {
  return {
    id: `gradient-${fieldName}`,
    startColor: color,
    startOpacity: 0.85,
    endColor: color,
    endOpacity: 0.15,
  };
}

const DEFAULT_SOURCE_COLOR = '#a1a1aa';

function sourceDefinition(fieldId: string): SourceFieldDefinition {
  return {
    fieldName: fieldId,
    displayName: displayNameOf(fieldId) ?? fieldId,
    color: colorOf(fieldId) ?? DEFAULT_SOURCE_COLOR,
  };
}

interface CategoryMetadata {
  id: SourceCategory;
  name: string;
  description: string;
  totalFieldNodeId: string;
}

const CATEGORY_METADATA: Record<SourceCategory, CategoryMetadata> = {
  damageDealt: {
    id: 'damageDealt',
    name: 'Damage Dealt',
    description: 'Breakdown of damage sources contributing to total damage dealt',
    totalFieldNodeId: DAMAGE__DAMAGE_DEALT_NODE.id,
  },
  coinIncome: {
    id: 'coinIncome',
    name: 'Coins Earned',
    description: 'Breakdown of coin income sources',
    totalFieldNodeId: BATTLE_REPORT__COINS_EARNED_NODE.id,
  },
};

function buildCategoryDefinition(metadata: CategoryMetadata): CategoryDefinition {
  return {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    totalField: metadata.totalFieldNodeId,
    sources: sourcesOf(metadata.totalFieldNodeId).map(sourceDefinition),
  };
}

export function getCategoryDefinition(categoryId: SourceCategory): CategoryDefinition {
  return buildCategoryDefinition(CATEGORY_METADATA[categoryId]);
}

export function getAvailableCategories(): CategoryDefinition[] {
  return Object.values(CATEGORY_METADATA).map(buildCategoryDefinition);
}
