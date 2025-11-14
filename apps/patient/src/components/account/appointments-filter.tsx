'use client';

import React, { useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types/api';

type AppointmentStatus = Appointment['status'] | 'all';

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending-payment', label: 'Pending payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked-in', label: 'Checked in' },
  { value: 'in-session', label: 'In session' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No show' },
];

type AppointmentsFilterProps = {
  statusFilter: AppointmentStatus;
  onStatusChange: (status: AppointmentStatus) => void;
  dateFilter: { from?: Date; to?: Date } | null;
  onDateChange: (dates: { from?: Date; to?: Date } | null) => void;
};

export const AppointmentsFilter = React.memo(
  ({ statusFilter, onStatusChange, dateFilter, onDateChange }: AppointmentsFilterProps) => {
    const handleClearDates = useCallback(() => {
      onDateChange(null);
    }, [onDateChange]);

    return (
      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <Label
            htmlFor="status-filter"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap"
          >
            Status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusChange(value as AppointmentStatus)}
          >
            <SelectTrigger id="status-filter" className="w-48 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap">
            Date range
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[280px] justify-start text-left font-normal rounded-full',
                  !dateFilter && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter?.from ? (
                  dateFilter.to ? (
                    <>
                      {format(dateFilter.from, 'LLL dd, y')} - {format(dateFilter.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateFilter.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateFilter?.from}
                selected={dateFilter ? { from: dateFilter.from, to: dateFilter.to } : undefined}
                onSelect={(range) => {
                  if (range?.from) {
                    onDateChange({ from: range.from, to: range.to });
                  } else {
                    onDateChange(null);
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleClearDates}
              aria-label="Clear date filter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
);

AppointmentsFilter.displayName = 'AppointmentsFilter';
