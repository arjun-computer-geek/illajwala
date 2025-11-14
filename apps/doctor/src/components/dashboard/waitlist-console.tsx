'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WaitlistEntry, WaitlistStatus } from '@illajwala/types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Textarea,
} from '@illajwala/ui';
import { toast } from 'sonner';
import { Activity, Ban, CheckCircle2, ClipboardList, Send } from 'lucide-react';
import { doctorWaitlistsApi } from '../../lib/api/waitlists';
import { useDoctorAuth } from '../../hooks/use-auth';
import { useWaitlistRealtime, type WaitlistRealtimeEvent } from '../../lib/realtime/waitlists';
import { WaitlistAnalytics } from './waitlist-analytics';
import { WaitlistPolicySettings } from './waitlist-policy-settings';
import { WaitlistEntryItem } from './waitlist-console/waitlist-entry-item';
import { BulkActionsBar } from './waitlist-console/bulk-actions-bar';
import { PriorityDialog } from './waitlist-console/priority-dialog';
import { PromoteDialog } from './waitlist-console/promote-dialog';
import { derivePatientLabel, formatDate } from './waitlist-console/utils';

type WaitlistConsoleState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; entries: WaitlistEntry[] }
  | { kind: 'error'; error: string };

type PromoteDialogState = {
  entry: WaitlistEntry;
  appointmentId: string;
  notes: string;
} | null;

type WaitlistFilter = 'active' | 'invited' | 'promoted' | 'expired' | 'cancelled';

const filterOrder: WaitlistFilter[] = ['active', 'invited', 'promoted', 'expired', 'cancelled'];

const statusBadgeVariant: Partial<
  Record<WaitlistStatus, 'default' | 'secondary' | 'outline' | 'destructive'>
> = {
  active: 'secondary',
  invited: 'default',
  promoted: 'default',
  expired: 'outline',
  cancelled: 'destructive',
};

const statusCopy: Record<
  WaitlistFilter,
  { label: string; description: string; icon: typeof Activity }
> = {
  active: {
    label: 'Active queue',
    description: 'Current patients waiting for open slots.',
    icon: ClipboardList,
  },
  invited: {
    label: 'Invited',
    description: 'Invitations sent, awaiting confirmation.',
    icon: Send,
  },
  promoted: {
    label: 'Promoted',
    description: 'Converted to confirmed appointments.',
    icon: CheckCircle2,
  },
  expired: {
    label: 'Expired',
    description: 'Entries that lapsed without response.',
    icon: Activity,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Removed manually by clinicians or admins.',
    icon: Ban,
  },
};

const filteredEntries = (entries: WaitlistEntry[], filter: WaitlistFilter) =>
  entries.filter((entry) => entry.status === filter);

export const WaitlistConsole = () => {
  const { doctor } = useDoctorAuth();
  const [state, setState] = useState<WaitlistConsoleState>({ kind: 'idle' });
  const [activeTab, setActiveTab] = useState<WaitlistFilter>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [promoteDialog, setPromoteDialog] = useState<WaitlistEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [priorityDialog, setPriorityDialog] = useState<{
    entry: WaitlistEntry;
    priorityScore: number;
  } | null>(null);
  const [bulkActionStatus, setBulkActionStatus] = useState<WaitlistStatus | null>(null);

  const fetchWaitlist = useCallback(async () => {
    if (!doctor) {
      return;
    }
    setState({ kind: 'loading' });
    try {
      const response = await doctorWaitlistsApi.list({
        pageSize: 100,
        sortBy: 'priority',
      });
      setState({ kind: 'ready', entries: response.data });
    } catch (error) {
      console.error('[doctor] Failed to load waitlist entries', error);
      setState({
        kind: 'error',
        error: 'We couldn’t load waitlist entries right now. Please retry shortly.',
      });
      toast.error('Waitlist unavailable', {
        description: 'Refresh the page or contact support if the issue persists.',
      });
    }
  }, [doctor]);

  // Initial fetch
  useEffect(() => {
    void fetchWaitlist();
  }, [fetchWaitlist]);

  // SSE real-time updates
  const { token } = useDoctorAuth();
  const [realtimeState, setRealtimeState] = useState<
    'idle' | 'connecting' | 'open' | 'error' | 'closed'
  >('idle');
  const handleRealtimeEvent = useCallback(
    (event: WaitlistRealtimeEvent) => {
      if (state.kind !== 'ready') {
        return;
      }

      if (
        event.type === 'waitlist.created' ||
        event.type === 'waitlist.updated' ||
        event.type === 'waitlist.status.changed'
      ) {
        const updatedEntries = [...state.entries];
        const existingIndex = updatedEntries.findIndex((e) => e._id === event.waitlist._id);
        if (existingIndex >= 0) {
          updatedEntries[existingIndex] = event.waitlist;
        } else {
          updatedEntries.push(event.waitlist);
        }
        setState({ kind: 'ready', entries: updatedEntries });
      } else if (event.type === 'waitlist.removed') {
        const updatedEntries = state.entries.filter((e) => e._id !== event.waitlistId);
        setState({ kind: 'ready', entries: updatedEntries });
      } else if (event.type === 'error') {
        console.error('[waitlist-console] SSE error:', event.message);
        // Fallback to polling on error
        void fetchWaitlist();
      }
    },
    [state, fetchWaitlist],
  );

  useWaitlistRealtime({
    token,
    enabled: state.kind === 'ready',
    onEvent: handleRealtimeEvent,
    onConnectionChange: (state) => {
      setRealtimeState(state);
    },
    onError: (error) => {
      console.error('[waitlist-console] SSE connection error:', error);
      // Fallback to polling on connection error
      if (state.kind === 'ready') {
        void fetchWaitlist();
      }
    },
  });

  const groupedEntries = useMemo(() => {
    if (state.kind !== 'ready') {
      return new Map<WaitlistFilter, WaitlistEntry[]>();
    }
    const map = new Map<WaitlistFilter, WaitlistEntry[]>();
    for (const filter of filterOrder) {
      map.set(filter, filteredEntries(state.entries, filter));
    }
    return map;
  }, [state]);

  const refresh = useCallback(() => {
    void fetchWaitlist();
  }, [fetchWaitlist]);

  const handleStatusUpdate = useCallback(
    async (entry: WaitlistEntry, status: WaitlistStatus, note?: string) => {
      // Optimistic update
      if (state.kind === 'ready') {
        const updatedEntries = state.entries.map((e) =>
          e._id === entry._id ? { ...e, status, notes: note || e.notes } : e,
        );
        setState({ kind: 'ready', entries: updatedEntries });
      }

      try {
        setProcessingId(entry._id);
        await doctorWaitlistsApi.updateStatus(entry._id, status, note);
        toast.success('Waitlist entry updated', {
          description: `Status set to ${status}`,
        });
        setNotesDraft('');
        // Refetch to ensure consistency
        await fetchWaitlist();
      } catch (error) {
        console.error('[doctor] Failed to update waitlist status', error);
        // Revert optimistic update on error
        await fetchWaitlist();
        toast.error('Unable to update waitlist entry', {
          description: 'Try again in a moment.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [fetchWaitlist, state],
  );

  const handlePriorityUpdate = useCallback(
    async (entry: WaitlistEntry, priorityScore: number, notes?: string) => {
      // Optimistic update
      if (state.kind === 'ready') {
        const updatedEntries = state.entries.map((e) =>
          e._id === entry._id ? { ...e, priorityScore } : e,
        );
        setState({ kind: 'ready', entries: updatedEntries });
      }

      try {
        setProcessingId(entry._id);
        await doctorWaitlistsApi.updatePriority(entry._id, priorityScore, notes);
        toast.success('Priority updated', {
          description: `Priority set to ${priorityScore}`,
        });
        setPriorityDialog(null);
        await fetchWaitlist();
      } catch (error) {
        console.error('[doctor] Failed to update priority', error);
        await fetchWaitlist();
        toast.error('Unable to update priority', {
          description: 'Try again in a moment.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [fetchWaitlist, state],
  );

  const handleBulkAction = useCallback(
    async (status: WaitlistStatus) => {
      if (selectedEntries.size === 0) {
        toast.error('No entries selected', {
          description: 'Select at least one waitlist entry.',
        });
        return;
      }

      const entryIds = Array.from(selectedEntries);
      try {
        const result = await doctorWaitlistsApi.bulkUpdateStatus(
          entryIds,
          status,
          notesDraft.trim() || undefined,
        );
        toast.success('Bulk update complete', {
          description: `Updated ${result.data.modified} of ${result.data.matched} entries.`,
        });
        setSelectedEntries(new Set());
        setNotesDraft('');
        setBulkActionStatus(null);
        await fetchWaitlist();
      } catch (error) {
        console.error('[doctor] Failed to bulk update', error);
        toast.error('Unable to update entries', {
          description: 'Try again in a moment.',
        });
        await fetchWaitlist();
      }
    },
    [selectedEntries, notesDraft, fetchWaitlist],
  );

  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (state.kind !== 'ready') {
      return;
    }
    const entries = groupedEntries.get(activeTab) ?? [];
    if (selectedEntries.size === entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entries.map((e) => e._id)));
    }
  }, [state, groupedEntries, activeTab, selectedEntries]);

  const handlePromote = useCallback(
    async (entry: WaitlistEntry, appointmentId: string, notes?: string) => {
      if (appointmentId.trim().length === 0) {
        toast.error('Appointment reference required', {
          description: 'Provide the appointment ID before promoting.',
        });
        return;
      }

      // Optimistic update
      if (state.kind === 'ready') {
        const updatedEntries = state.entries.map((e) =>
          e._id === entry._id
            ? {
                ...e,
                status: 'promoted' as WaitlistStatus,
                promotedAppointmentId: appointmentId.trim(),
              }
            : e,
        );
        setState({ kind: 'ready', entries: updatedEntries });
      }

      try {
        setProcessingId(entry._id);
        await doctorWaitlistsApi.promote(entry._id, appointmentId.trim(), notes);
        toast.success('Waitlist entry promoted', {
          description: 'The patient has been moved into a confirmed slot.',
        });
        setNotesDraft('');
        // Refetch to ensure consistency
        await fetchWaitlist();
      } catch (error) {
        console.error('[doctor] Failed to promote waitlist entry', error);
        // Revert optimistic update on error
        await fetchWaitlist();
        toast.error('Unable to promote waitlist entry', {
          description: 'Ensure the appointment ID is valid and try again.',
        });
      } finally {
        setProcessingId(null);
      }
    },
    [fetchWaitlist, state],
  );

  const renderEntries = (entries: WaitlistEntry[]) => {
    if (state.kind === 'loading') {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      );
    }

    if (state.kind === 'error') {
      return (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Waitlist unavailable</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      );
    }

    if (entries.length === 0) {
      const copy = statusCopy[activeTab];
      return (
        <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{copy.label}</p>
          <p className="mt-2 text-xs text-muted-foreground/90">{copy.description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <WaitlistEntryItem
            key={entry._id}
            entry={entry}
            isSelected={selectedEntries.has(entry._id)}
            isProcessing={processingId === entry._id}
            onSelect={() => toggleEntrySelection(entry._id)}
            onStatusUpdate={(status, notes) => void handleStatusUpdate(entry, status, notes)}
            onPromote={() => setPromoteDialog(entry)}
            onPriorityOverride={() =>
              setPriorityDialog({ entry, priorityScore: entry.priorityScore ?? 0 })
            }
            notesDraft={notesDraft}
            statusBadgeVariant={statusBadgeVariant}
            derivePatientLabel={derivePatientLabel}
            formatDate={formatDate}
          />
        ))}
      </div>
    );
  };

  const renderTabsContent = () => {
    if (state.kind !== 'ready') {
      return renderEntries([]);
    }
    const entries = groupedEntries.get(activeTab) ?? [];
    return renderEntries(entries);
  };

  const [activeView, setActiveView] = useState<'console' | 'analytics' | 'settings'>('console');

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <ClipboardList className="h-5 w-5 text-primary" />
              Waitlist Management
            </CardTitle>
            <CardDescription>Review and action patients waiting for openings.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeView === 'console' && realtimeState === 'open' && (
              <Badge
                variant="outline"
                className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.3em]"
              >
                Live
              </Badge>
            )}
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="console">Console</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        {activeView === 'console' && (
          <>
            <BulkActionsBar
              selectedCount={selectedEntries.size}
              bulkActionStatus={bulkActionStatus}
              onBulkActionChange={(status) => setBulkActionStatus(status)}
              onApply={() => void handleBulkAction(bulkActionStatus!)}
              onClear={() => {
                setSelectedEntries(new Set());
                setBulkActionStatus(null);
              }}
            />
            <CardContent className="space-y-4">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as WaitlistFilter)}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-2">
                  <TabsList className="grid w-full grid-cols-5 rounded-full bg-muted/40 p-1 text-xs">
                    {filterOrder.map((filter) => (
                      <TabsTrigger key={filter} value={filter} className="rounded-full capitalize">
                        {filter}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {state.kind === 'ready' && (groupedEntries.get(activeTab) ?? []).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-3 text-xs ml-2"
                      onClick={toggleSelectAll}
                    >
                      {selectedEntries.size === (groupedEntries.get(activeTab) ?? []).length
                        ? 'Deselect all'
                        : 'Select all'}
                    </Button>
                  )}
                </div>
                <TabsContent value={activeTab} className="mt-4">
                  {renderTabsContent()}
                </TabsContent>
              </Tabs>
              <div className="space-y-3">
                <Label
                  htmlFor="waitlist-notes"
                  className="text-xs uppercase tracking-[0.3em] text-muted-foreground"
                >
                  Notes (applies to next action)
                </Label>
                <Textarea
                  id="waitlist-notes"
                  placeholder="Jot down context to include when inviting or cancelling…"
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>

            {promoteDialog && (
              <PromoteDialog
                entry={promoteDialog}
                isOpen={Boolean(promoteDialog)}
                isProcessing={processingId === promoteDialog._id}
                onClose={() => setPromoteDialog(null)}
                onPromote={async (appointmentId, notes) => {
                  await handlePromote(promoteDialog, appointmentId, notes);
                  setPromoteDialog(null);
                }}
              />
            )}

            {priorityDialog && (
              <PriorityDialog
                entry={priorityDialog.entry}
                priorityScore={priorityDialog.priorityScore}
                isOpen={Boolean(priorityDialog)}
                isProcessing={processingId === priorityDialog.entry._id}
                onClose={() => setPriorityDialog(null)}
                onSave={async (score, notes) => {
                  await handlePriorityUpdate(priorityDialog.entry, score, notes);
                  setPriorityDialog(null);
                }}
              />
            )}
          </>
        )}
        {activeView === 'analytics' && (
          <CardContent>
            <WaitlistAnalytics />
          </CardContent>
        )}
        {activeView === 'settings' && (
          <CardContent>
            <WaitlistPolicySettings />
          </CardContent>
        )}
      </Card>
    </div>
  );
};
