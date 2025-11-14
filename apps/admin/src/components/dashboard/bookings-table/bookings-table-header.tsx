'use client';

import React from 'react';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@illajwala/ui';
import { RefreshCw } from 'lucide-react';
import type { AppointmentStatus } from '@illajwala/types';
import { statusFilterOptions } from './utils';

type BookingsTableHeaderProps = {
  statusFilter: AppointmentStatus | 'all';
  onStatusFilterChange: (value: AppointmentStatus | 'all') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export const BookingsTableHeader = React.memo(
  ({ statusFilter, onStatusFilterChange, isRefreshing, onRefresh }: BookingsTableHeaderProps) => {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusFilterChange(value as AppointmentStatus | 'all')}
        >
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          className="gap-2 rounded-full px-3 text-xs"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    );
  },
);

BookingsTableHeader.displayName = 'BookingsTableHeader';
