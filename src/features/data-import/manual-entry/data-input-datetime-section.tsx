import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Input, FormControl } from '@/components/ui';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';

interface DataInputDateTimeSectionProps {
  selectedDate: Date;
  selectedTime: { hours: string; minutes: string };
  isDatePopoverOpen: boolean;
  onDatePopoverOpenChange: (open: boolean) => void;
  onDateSelect: (date: Date | undefined) => void;
  onTimeChange: (field: 'hours' | 'minutes', value: string) => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DataInputDateTimeSection({
  selectedDate,
  selectedTime,
  isDatePopoverOpen,
  onDatePopoverOpenChange,
  onDateSelect,
  onTimeChange,
  disabled = false,
  disabledReason
}: DataInputDateTimeSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormControl label="Date" className="w-full">
        {disabled && disabledReason && (
          <p className="text-xs text-muted-foreground mb-1">{disabledReason}</p>
        )}
        <Popover open={disabled ? false : isDatePopoverOpen} onOpenChange={disabled ? undefined : onDatePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 justify-start w-full h-10 hover:bg-accent/30 hover:border-accent/50 transition-all duration-200 font-normal"
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{format(selectedDate, "MMM d, yyyy")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </FormControl>

      <FormControl label="Time" className="w-full">
        <div className={`group inline-flex items-center justify-start gap-2 px-3 h-11 border border-input rounded-md transition-all duration-200 ${disabled ? 'bg-muted/50 cursor-not-allowed' : 'bg-background hover:bg-accent/30 hover:border-accent/50 focus-within:border-orange-500/60 focus-within:bg-orange-500/5'}`}>
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-foreground/70 transition-colors" />
          <div className="flex items-center gap-1 flex-1 h-full">
            <Input
              type="number"
              min="0"
              max="23"
              value={selectedTime.hours}
              onChange={(e) => onTimeChange('hours', e.target.value)}
              className="w-14 text-center border-0 bg-transparent focus:outline-none focus:ring-0"
              placeholder="HH"
              disabled={disabled}
            />
            <span className="text-muted-foreground font-semibold">:</span>
            <Input
              type="number"
              min="0"
              max="59"
              value={selectedTime.minutes}
              onChange={(e) => onTimeChange('minutes', e.target.value)}
              className="w-14 text-center border-0 bg-transparent focus:outline-none focus:ring-0"
              placeholder="MM"
              disabled={disabled}
            />
          </div>
        </div>
      </FormControl>
    </div>
  );
}