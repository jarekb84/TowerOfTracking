/**
 * Edit Event Dialog Component
 *
 * Dialog for editing existing spending events.
 */

import { useState, useEffect, useMemo } from 'react'
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
import type { SpendingEvent } from '../types'
import { getAllCurrencyConfigs } from '../currencies/currency-config'
import { AddEventForm } from './add-event-form'
import { getDisplayValueAndScale, calculateFinalAmount, parseDurationDays } from './event-form-utils'

interface SaveEventData {
  eventId: string
  name: string
  currencyId: CurrencyId
  amount: number
  durationDays?: number
}

interface EditEventDialogProps {
  event: SpendingEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: SaveEventData) => void
}

export function EditEventDialog({ event, isOpen, onClose, onSave }: EditEventDialogProps) {
  const [name, setName] = useState('')
  const [currencyId, setCurrencyId] = useState<CurrencyId>(CurrencyId.Coins)
  const [amountValue, setAmountValue] = useState('')
  const [amountScale, setAmountScale] = useState('T')
  const [durationDays, setDurationDays] = useState('')

  const currencies = useMemo(() => getAllCurrencyConfigs(), [])
  const selectedCurrency = currencies.find((c) => c.id === currencyId)!

  // Populate form when event changes
  useEffect(() => {
    if (event) {
      setName(event.name)
      setCurrencyId(event.currencyId)

      const config = currencies.find((c) => c.id === event.currencyId)
      if (config?.hasUnitSelector) {
        const { value, scale } = getDisplayValueAndScale(event.amount)
        setAmountValue(value)
        setAmountScale(scale)
      } else {
        setAmountValue(event.amount.toString())
        setAmountScale('')
      }

      setDurationDays(event.durationDays?.toString() || '')
    }
  }, [event, currencies])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    const finalAmount = calculateFinalAmount(amountValue, amountScale, selectedCurrency.hasUnitSelector)
    if (!name.trim() || finalAmount <= 0) return

    onSave({
      eventId: event.id,
      name: name.trim(),
      currencyId,
      amount: finalAmount,
      durationDays: parseDurationDays(durationDays),
    })
    onClose()
  }

  const isValid = name.trim() !== '' && (parseFloat(amountValue) || 0) > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Spending Event</DialogTitle>
          <DialogDescription>
            Modify the details of this spending event.
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
