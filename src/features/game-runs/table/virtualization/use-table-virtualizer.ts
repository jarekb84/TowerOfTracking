import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import { type RefObject, useCallback } from 'react';
import { type Row } from '@tanstack/react-table';
import type { ParsedGameRun } from '@/shared/types/game-run.types';
import {
  type VirtualizationVariant,
  getEstimatedRowHeight,
  getOverscan,
} from './virtualization-config';

interface UseTableVirtualizerOptions {
  /** Ref to the scrollable container element */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Array of TanStack Table rows */
  rows: Row<ParsedGameRun>[];
  /** Rendering variant (desktop table or mobile cards) */
  variant: VirtualizationVariant;
}

interface UseTableVirtualizerResult {
  /** Array of virtual items to render (only visible + overscan) */
  virtualItems: VirtualItem[];
  /** Total height of all rows in pixels (for scroll container) */
  totalSize: number;
  /** Callback ref to attach to each row for dynamic height measurement */
  measureElement: (node: HTMLElement | null) => void;
}

/**
 * Hook that provides virtualization for game run tables.
 * Handles both desktop table rows and mobile card views.
 * Supports dynamic row heights for expandable content.
 */
export function useTableVirtualizer({
  containerRef,
  rows,
  variant,
}: UseTableVirtualizerOptions): UseTableVirtualizerResult {
  const overscan = getOverscan(variant);

  // Create the estimate function that accounts for expanded rows
  const estimateSize = useCallback(
    (index: number) => {
      const row = rows[index];
      if (!row) {
        return getEstimatedRowHeight(variant, false);
      }
      const isExpanded = row.getIsExpanded();
      return getEstimatedRowHeight(variant, isExpanded);
    },
    [rows, variant]
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize,
    overscan,
    // Use row ID as key for stable identity across sorts/filters
    getItemKey: (index) => rows[index]?.id ?? index,
  });

  // Note: The measureElement callback (via ResizeObserver) handles dynamic height changes
  // automatically when rows expand/collapse. We don't need to manually call measure().

  return {
    virtualItems: virtualizer.getVirtualItems(),
    totalSize: virtualizer.getTotalSize(),
    measureElement: virtualizer.measureElement,
  };
}
