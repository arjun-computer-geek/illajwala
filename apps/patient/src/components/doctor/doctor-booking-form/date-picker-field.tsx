'use client';

import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { UseFormReturn } from 'react-hook-form';

type DatePickerFieldProps = {
  form: UseFormReturn<{ mode: string; date: Date; time: string; reason?: string }>;
  disabled?: boolean;
  disabledBefore?: (date: Date) => boolean;
};

export const DatePickerField = React.memo(
  ({ form, disabled, disabledBefore }: DatePickerFieldProps) => {
    return (
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Preferred date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-between text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                    disabled={disabled}
                  >
                    {field.value ? format(field.value, 'EEE, dd MMM yyyy') : 'Pick a date'}
                    <CalendarIcon className="h-4 w-4 opacity-60" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    form.setValue('time', '', { shouldDirty: true });
                  }}
                  disabled={disabledBefore}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  },
);

DatePickerField.displayName = 'DatePickerField';
