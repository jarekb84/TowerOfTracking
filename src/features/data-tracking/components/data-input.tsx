import { useState } from 'react';
import { Button, Textarea, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Calendar, Popover, PopoverContent, PopoverTrigger, Input } from '../../../components/ui';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { parseGameRun, formatNumber, formatDuration, calculatePerHour, formatTierLabel } from '../utils/data-parser';
import { useData } from '../hooks/use-data';
import { Plus, Upload } from 'lucide-react';
import type { ParsedGameRun } from '../types/game-run.types';

interface DataInputProps {
  className?: string;
}

export function DataInput({ className }: DataInputProps) {
  const [inputData, setInputData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedGameRun | null>(null);
  const [selectedRunType, setSelectedRunType] = useState<'farm' | 'tournament'>('farm');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<{ hours: string; minutes: string }>(() => {
    const now = new Date();
    return {
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0')
    };
  });
  const { addRun } = useData();

  const handlePaste = async (): Promise<void> => {
    try {
      const text = await navigator.clipboard.readText();
      setInputData(text);
      if (text.trim()) {
        const parsed = parseGameRun(text, getDateTimeFromSelection());
        setPreviewData(parsed);
        setSelectedRunType(parsed.runType);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  const handleInputChange = (value: string): void => {
    setInputData(value);
    if (value.trim()) {
      try {
        const parsed = parseGameRun(value, getDateTimeFromSelection());
        setPreviewData(parsed);
        setSelectedRunType(parsed.runType);
      } catch (error) {
        setPreviewData(null);
      }
    } else {
      setPreviewData(null);
    }
  };

  const handleSave = (): void => {
    if (previewData) {
      // Allow manual override of runType
      addRun({ ...previewData, runType: selectedRunType });
      setInputData('');
      setPreviewData(null);
      setIsDialogOpen(false);
    }
  };

  const handleCancel = (): void => {
    setInputData('');
    setPreviewData(null);
    setSelectedRunType('farm');
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime({
      hours: now.getHours().toString().padStart(2, '0'),
      minutes: now.getMinutes().toString().padStart(2, '0')
    });
    setIsDialogOpen(false);
  };

  const getDateTimeFromSelection = (): Date => {
    const dateTime = new Date(selectedDate);
    dateTime.setHours(parseInt(selectedTime.hours, 10));
    dateTime.setMinutes(parseInt(selectedTime.minutes, 10));
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);
    return dateTime;
  };

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      setSelectedDate(date);
      // Re-parse data with new date/time if we have input
      if (inputData.trim()) {
        try {
          const dateTime = new Date(date);
          dateTime.setHours(parseInt(selectedTime.hours, 10));
          dateTime.setMinutes(parseInt(selectedTime.minutes, 10));
          const parsed = parseGameRun(inputData, dateTime);
          setPreviewData(parsed);
          setSelectedRunType(parsed.runType);
        } catch (error) {
          setPreviewData(null);
        }
      }
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: string): void => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    
    // Re-parse data with new time if we have input
    if (inputData.trim()) {
      try {
        const dateTime = new Date(selectedDate);
        dateTime.setHours(parseInt(newTime.hours, 10));
        dateTime.setMinutes(parseInt(newTime.minutes, 10));
        const parsed = parseGameRun(inputData, dateTime);
        setPreviewData(parsed);
        setSelectedRunType(parsed.runType);
      } catch (error) {
        setPreviewData(null);
      }
    }
  };

  return (
    <div className={className}>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Game Run
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Game Run</DialogTitle>
            <DialogDescription>
              Paste your game stats below. The data should be tab-delimited with each stat on a new line.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handlePaste}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Paste from Clipboard
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2 min-w-[180px] justify-start"
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {format(selectedDate, "MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Time:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={selectedTime.hours}
                      onChange={(e) => handleTimeChange('hours', e.target.value)}
                      className="w-16 text-center"
                      placeholder="HH"
                    />
                    <span className="text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={selectedTime.minutes}
                      onChange={(e) => handleTimeChange('minutes', e.target.value)}
                      className="w-16 text-center"
                      placeholder="MM"
                    />
                  </div>
                </div>
              </div>
              <Textarea
                placeholder="Paste your game stats here...
Example format:
Game Time        1d 13h 24m 51s
Real Time        7h 46m 6s
Tier        10
Wave        5881
Coins Earned        1.13T
Cash Earned        $44.65B"
                value={inputData}
                onChange={(e) => handleInputChange(e.target.value)}
                className="font-mono text-sm h-48 resize-none"
              />
            </div>

            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <CardDescription>
                    Here's how your data will be interpreted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground w-24">Run Type</label>
                      <select
                        className="border rounded px-2 py-1 text-sm bg-background"
                        value={selectedRunType}
                        onChange={(e) => setSelectedRunType(e.target.value as 'farm' | 'tournament')}
                      >
                        <option value="farm">Farm</option>
                        <option value="tournament">Tournament</option>
                      </select>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Stats</h4>
                      <div className="space-y-1 text-sm">
                        {previewData.realTime && (
                          <div>Real Time: {formatDuration(previewData.realTime)}</div>
                        )}
                        {previewData && (
                          <div>
                            Tier: {formatTierLabel(previewData.camelCaseData?.tier, previewData.tier)}
                          </div>
                        )}
                        {previewData.wave && <div>Wave: {formatNumber(previewData.wave)}</div>}
                        {previewData.processedData.killedBy && <div>Killed By: {previewData.processedData.killedBy}</div>}
                        {previewData.coinsEarned && (
                          <div>
                            Coins: {formatNumber(previewData.coinsEarned)} (
                            {formatNumber(calculatePerHour(previewData.coinsEarned, previewData.realTime || 0))}/hr)
                          </div>
                        )}
                        {previewData.cellsEarned && (
                          <div>
                            Cells: {formatNumber(previewData.cellsEarned)} (
                            {formatNumber(calculatePerHour(previewData.cellsEarned, previewData.realTime || 0))}/hr)
                          </div>
                        )}
                        <div>Timestamp: {format(previewData.timestamp, "PPp")}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!previewData}
            >
              Save Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
