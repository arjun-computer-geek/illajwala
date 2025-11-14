'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTransition } from 'react';

type SortOption = 'relevance' | 'name-asc' | 'name-desc' | 'specialization' | 'availability';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'specialization', label: 'Specialization' },
  { value: 'availability', label: 'Earliest available' },
];

export const SearchSort = React.memo(() => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentSort = (searchParams.get('sort') as SortOption) || 'relevance';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'relevance') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    startTransition(() => {
      router.replace(`/search?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Label
        htmlFor="search-sort"
        className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap"
      >
        Sort by
      </Label>
      <Select value={currentSort} onValueChange={handleSortChange} disabled={isPending}>
        <SelectTrigger id="search-sort" className="w-48 rounded-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

SearchSort.displayName = 'SearchSort';
