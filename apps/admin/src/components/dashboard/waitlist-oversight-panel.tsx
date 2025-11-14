'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '@illajwala/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { WaitlistEntry } from '@illajwala/types';
import { adminWaitlistsApi } from '@/lib/api/waitlists';
import { adminClinicsApi } from '@/lib/api/clinics';
import { adminQueryKeys } from '@/lib/query-keys';
import { WaitlistEntryItem } from './waitlist-oversight-panel/waitlist-entry-item';
import { PolicyForm } from './waitlist-oversight-panel/policy-form';
import { StatusBadges } from './waitlist-oversight-panel/status-badges';
import { calculateAverageWaitMinutes } from './waitlist-oversight-panel/utils';

type PolicyFormState = {
  maxQueueSize: string;
  autoExpiryHours: string;
  autoPromoteBufferMinutes: string;
  notes: string;
};

type ClinicFilter = 'all' | string;

export const WaitlistOversightPanel = () => {
  const queryClient = useQueryClient();
  const [clinicFilter, setClinicFilter] = useState<ClinicFilter>('all');
  const [policyForm, setPolicyForm] = useState<PolicyFormState>({
    maxQueueSize: '',
    autoExpiryHours: '',
    autoPromoteBufferMinutes: '',
    notes: '',
  });

  const selectedClinicId = clinicFilter === 'all' ? null : clinicFilter;

  const waitlistQuery = useQuery({
    queryKey: adminQueryKeys.waitlistEntries(selectedClinicId),
    queryFn: () =>
      adminWaitlistsApi.list({
        clinicId: selectedClinicId ?? undefined,
        pageSize: 100,
        sortBy: 'priority',
      }),
    staleTime: 60_000,
  });

  const policyQuery = useQuery({
    queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId),
    queryFn: () => adminWaitlistsApi.getPolicy(selectedClinicId ?? undefined),
    enabled: !waitlistQuery.isPending,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (policyQuery.data) {
      setPolicyForm({
        maxQueueSize: String(policyQuery.data.maxQueueSize ?? 0),
        autoExpiryHours: String(policyQuery.data.autoExpiryHours ?? 0),
        autoPromoteBufferMinutes: String(policyQuery.data.autoPromoteBufferMinutes ?? 0),
        notes: '',
      });
    }
  }, [policyQuery.data, selectedClinicId]);

  const policyMutation = useMutation({
    mutationFn: adminWaitlistsApi.upsertPolicy,
    onSuccess: (updatedPolicy) => {
      toast.success('Waitlist policy updated', {
        description: 'Changes saved. Updates propagate to new entries immediately.',
      });
      setPolicyForm((current) => ({
        ...current,
        maxQueueSize: String(updatedPolicy.maxQueueSize ?? current.maxQueueSize),
        autoExpiryHours: String(updatedPolicy.autoExpiryHours ?? current.autoExpiryHours),
        autoPromoteBufferMinutes: String(
          updatedPolicy.autoPromoteBufferMinutes ?? current.autoPromoteBufferMinutes,
        ),
        notes: '',
      }));
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId),
      });
    },
    onError: () => {
      toast.error('Unable to update waitlist policy', {
        description: 'Try again in a moment or contact platform support.',
      });
    },
  });

  const entries = waitlistQuery.data?.data ?? [];

  const clinicsQuery = useQuery({
    queryKey: adminQueryKeys.clinics(),
    queryFn: () => adminClinicsApi.list({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  const clinics = clinicsQuery.data?.data ?? [];

  const statusBuckets = useMemo(() => {
    const buckets: Record<WaitlistEntry['status'], WaitlistEntry[]> = {
      active: [],
      invited: [],
      promoted: [],
      expired: [],
      cancelled: [],
    };
    for (const entry of entries) {
      buckets[entry.status]?.push(entry);
    }
    return buckets;
  }, [entries]);

  const averageQueueWait = useMemo(() => {
    const waitingEntries = [...statusBuckets.active, ...statusBuckets.invited];
    return calculateAverageWaitMinutes(waitingEntries);
  }, [statusBuckets]);

  const handlePolicySave = useCallback(() => {
    const maxQueueSize = Number(policyForm.maxQueueSize);
    const autoExpiryHours = Number(policyForm.autoExpiryHours);
    const autoPromoteBufferMinutes = Number(policyForm.autoPromoteBufferMinutes);

    if (!Number.isFinite(maxQueueSize) || maxQueueSize <= 0) {
      toast.error('Invalid max queue size', {
        description: 'Provide a positive number of allowed waitlist entries.',
      });
      return;
    }

    if (!Number.isFinite(autoExpiryHours) || autoExpiryHours <= 0) {
      toast.error('Invalid auto expiry window', {
        description: 'Provide a positive number of hours before entries expire.',
      });
      return;
    }

    if (!Number.isFinite(autoPromoteBufferMinutes) || autoPromoteBufferMinutes <= 0) {
      toast.error('Invalid auto promote buffer', {
        description: 'Provide a positive number of minutes for promotion buffers.',
      });
      return;
    }

    policyMutation.mutate({
      clinicId: selectedClinicId ?? undefined,
      maxQueueSize,
      autoExpiryHours,
      autoPromoteBufferMinutes,
    });
  }, [policyMutation, policyForm, selectedClinicId]);

  const renderEntries = () => {
    if (waitlistQuery.isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-lg" />
          ))}
        </div>
      );
    }

    if (waitlistQuery.isError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
          Unable to load waitlist entries right now. Refresh or verify the identity-service is
          reachable.
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="rounded-lg border border-muted-foreground/20 bg-muted/20 p-4 text-xs text-muted-foreground">
          No waitlist entries detected for this scope. Patients joining from the apps will appear
          here.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.slice(0, 8).map((entry) => (
          <WaitlistEntryItem key={entry._id} entry={entry} />
        ))}
        {entries.length > 8 ? (
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Showing top {Math.min(entries.length, 8)} of {entries.length} entries.
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <ClipboardList className="h-4 w-4 text-primary" />
              Waitlist oversight
            </CardTitle>
            <CardDescription>
              Track queue depth, pending invitations, and policy settings across clinics.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-full px-3 text-xs"
            onClick={() => {
              void waitlistQuery.refetch();
              void policyQuery.refetch();
            }}
            disabled={waitlistQuery.isFetching || policyQuery.isFetching}
          >
            {waitlistQuery.isFetching || policyQuery.isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Refresh
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="space-y-1">
            <Label
              htmlFor="admin-waitlist-clinic"
              className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
            >
              Clinic scope
            </Label>
            <Select
              value={clinicFilter}
              onValueChange={(value) => setClinicFilter(value as ClinicFilter)}
              disabled={waitlistQuery.isLoading || clinicsQuery.isLoading}
            >
              <SelectTrigger id="admin-waitlist-clinic" className="w-44 rounded-full">
                <SelectValue placeholder="All clinics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clinics</SelectItem>
                {clinics.map((clinic) => (
                  <SelectItem key={clinic._id} value={clinic._id}>
                    {clinic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <StatusBadges buckets={statusBuckets} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {averageQueueWait !== null ? (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-xs text-primary">
            Average wait for active and invited patients: {averageQueueWait} minutes.
          </div>
        ) : null}

        {renderEntries()}

        <PolicyForm
          form={policyForm}
          onFormChange={setPolicyForm}
          onSave={handlePolicySave}
          onReset={() => {
            if (policyQuery.data) {
              setPolicyForm({
                maxQueueSize: String(policyQuery.data.maxQueueSize ?? 0),
                autoExpiryHours: String(policyQuery.data.autoExpiryHours ?? 0),
                autoPromoteBufferMinutes: String(policyQuery.data.autoPromoteBufferMinutes ?? 0),
                notes: '',
              });
            }
          }}
          isSaving={policyMutation.isPending}
          isLoading={policyQuery.isLoading}
          clinicLabel={clinicFilter === 'all' ? 'tenant defaults' : `clinic ${clinicFilter}`}
        />
      </CardContent>
      <CardFooter className="text-[11px] text-muted-foreground/80">
        Policy updates apply immediately to new entries. Existing entries honour previous settings
        until refreshed.
      </CardFooter>
    </Card>
  );
};
