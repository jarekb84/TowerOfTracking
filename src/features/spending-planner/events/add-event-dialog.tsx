/**
 * Add Event Dialog Component
 *
 * Dialog for adding new spending events to the queue.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CurrencyId } from '../types'
import { getAllCurrencyConfigs } from '../currencies/currency-config'
import { AddEventForm, SCALE_OPTIONS } from './add-event-form'

interface AddEventDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, currencyId: CurrencyId, amount: number, durationDays?: number) => void
}

export function AddEventDialog({ isOpen, onClose, onAdd }: AddEventDialogProps) {
  const [name, setName] = useState('')
  const [currencyId, setCurrencyId] = useState<CurrencyId>(CurrencyId.Coins)
  const [amountValue, setAmountValue] = useState('')
  const [amountScale, setAmountScale] = useState('T')
  const [durationDays, setDurationDays] = useState('')

  const currencies = getAllCurrencyConfigs()
  const selectedCurrency = currencies.find((c) => c.id === currencyId)!

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const baseAmount = parseFloat(amountValue) || 0
    const multiplier = SCALE_OPTIONS.find((s) => s.value === amountScale)?.multiplier || 1
    const finalAmount = selectedCurrency.hasUnitSelector ? baseAmount * multiplier : baseAmount

    if (name.trim() && finalAmount > 0) {
      const duration = durationDays ? parseInt(durationDays, 10) : undefined
      onAdd(name.trim(), currencyId, finalAmount, duration && duration > 0 ? duration : undefined)
      handleClose()
    }
  }

  const handleClose = () => {
    setName('')
    setCurrencyId(CurrencyId.Coins)
    setAmountValue('')
    setAmountScale('T')
    setDurationDays('')
    onClose()
  }

  const isValid = name.trim() !== '' && (parseFloat(amountValue) || 0) > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Spending Event</DialogTitle>
          <DialogDescription>
            Add a new upgrade, unlock, or other spending event to your plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <AddEventForm
            name={name}
            currencyId={currencyId}
            amountValue={amountValue}
            amountScale={amountScale}
            durationDays={durationDays}
            currencies={currencies}
            selectedCurrency={selectedCurrency}
            onNameChange={setName}
            onCurrencyChange={setCurrencyId}
            onAmountValueChange={setAmountValue}
            onAmountScaleChange={setAmountScale}
            onDurationChange={setDurationDays}
          />

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Add Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
