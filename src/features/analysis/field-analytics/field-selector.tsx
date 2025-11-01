import { useState, useMemo, useRef, useEffect } from 'react'
import { Input, Button } from '@/components/ui'
import { filterFieldOptions } from './field-selector-logic'
import { cn } from '@/shared/lib/utils'

export interface FieldOption {
  value: string        // Field key (e.g., 'damage_dealt')
  label: string        // Display name (e.g., 'Damage Dealt')
  dataType: string     // 'number' | 'duration'
}

interface FieldSelectorProps {
  selectedField: string
  onFieldChange: (fieldKey: string) => void
  availableFields: FieldOption[]
}

export function FieldSelector({ selectedField, onFieldChange, availableFields }: FieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredFields = useMemo(() =>
    filterFieldOptions(availableFields, searchTerm),
    [availableFields, searchTerm]
  )

  const selectedFieldOption = availableFields.find(f => f.value === selectedField)

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const handleFieldSelect = (fieldKey: string) => {
    onFieldChange(fieldKey)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Selected Field Display Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between transition-all duration-200",
          isOpen
            ? "bg-indigo-500/10 border-indigo-500/60 text-slate-100"
            : "bg-slate-800/30 border-slate-600/40 text-slate-200 hover:bg-slate-700/40 hover:border-slate-500/50"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-indigo-400 font-semibold text-base">📊</span>
          <span className="font-medium">{selectedFieldOption?.label || selectedField}</span>
          <span className="text-xs text-slate-400 ml-1">({selectedFieldOption?.dataType || 'number'})</span>
        </span>
        <span className={cn(
          "transition-transform duration-200 text-slate-400",
          isOpen && "rotate-180"
        )}>
          ▼
        </span>
      </Button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' || e.key === 'Enter') {
                setIsOpen(false)
              }
            }}
            aria-label="Close dropdown"
          />

          {/* Dropdown Content */}
          <div className="absolute z-50 mt-2 w-full bg-slate-800/95 border border-slate-600/50 rounded-lg shadow-2xl shadow-black/50 backdrop-blur-sm">
            {/* Search Input */}
            <div className="p-3 border-b border-slate-700/50">
              <Input
                ref={searchInputRef}
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900/50 border-slate-600/50 text-slate-100 placeholder:text-slate-400 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
              />
              <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                <span>Showing {filteredFields.length} of {availableFields.length} fields</span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-indigo-400/80 hover:text-indigo-300 transition-colors px-2 py-1 rounded hover:bg-indigo-500/10"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Field List */}
            <div className="max-h-[400px] overflow-y-auto">
              {filteredFields.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  No fields match &quot;{searchTerm}&quot;
                </div>
              ) : (
                <div className="p-2 space-y-0.5">
                  {filteredFields.map(field => (
                    <button
                      key={field.value}
                      onClick={() => handleFieldSelect(field.value)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-md text-left transition-all duration-150 flex items-center justify-between group",
                        field.value === selectedField
                          ? "bg-indigo-500/15 border border-indigo-500/40 text-slate-100 hover:bg-indigo-500/20 hover:border-indigo-500/50"
                          : "bg-transparent hover:bg-slate-700/40 text-slate-300 hover:text-slate-100 border border-transparent"
                      )}
                    >
                      <span className="font-medium">{field.label}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full transition-colors shrink-0",
                        field.value === selectedField
                          ? "bg-indigo-500/25 text-indigo-200"
                          : "bg-slate-700/40 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-slate-300"
                      )}>
                        {field.dataType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
