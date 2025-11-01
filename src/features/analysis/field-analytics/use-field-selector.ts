import { useState, useMemo } from 'react'
import { ParsedGameRun } from '@/shared/types/game-run.types'
import { extractNumericFieldNames, getFieldDataType } from '@/shared/domain/fields/field-discovery'
import { formatFieldDisplayName } from '@/shared/domain/fields/field-formatters'
import type { FieldOption } from './field-selector'

interface UseFieldSelectorReturn {
  selectedField: string
  setSelectedField: (field: string) => void
  availableFields: FieldOption[]
  isLoading: boolean
}

export function useFieldSelector(runs: ParsedGameRun[]): UseFieldSelectorReturn {
  const [selectedField, setSelectedField] = useState<string>('rerollShardsEarned')

  const availableFields = useMemo(() => {
    const numericFields = extractNumericFieldNames(runs)
    return numericFields
      .map(fieldKey => ({
        value: fieldKey,
        label: formatFieldDisplayName(fieldKey),
        dataType: getFieldDataType(runs, fieldKey),
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [runs])

  return {
    selectedField,
    setSelectedField,
    availableFields,
    isLoading: runs.length === 0,
  }
}
