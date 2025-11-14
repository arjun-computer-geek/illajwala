'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@illajwala/ui';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';
import { doctorWaitlistsApi } from '../../lib/api/waitlists';
import { useDoctorAuth } from '../../hooks/use-auth';
import { PolicyFormField } from './waitlist-policy-settings/policy-form-field';
import { PolicyLoadingSkeleton } from './waitlist-policy-settings/policy-loading-skeleton';
import { PriorityWeightsSection } from './waitlist-policy-settings/priority-weights-section';

type WaitlistPolicy = {
  maxQueueSize: number;
  autoExpiryHours: number;
  autoPromoteBufferMinutes: number;
  priorityWeights?: Record<string, number>;
};

type PolicyState =
  | { kind: 'idle' | 'loading' }
  | { kind: 'ready'; policy: WaitlistPolicy }
  | { kind: 'error'; error: string };

export const WaitlistPolicySettings = () => {
  const { doctor } = useDoctorAuth();
  const [state, setState] = useState<PolicyState>({ kind: 'idle' });
  const [formData, setFormData] = useState<WaitlistPolicy>({
    maxQueueSize: 250,
    autoExpiryHours: 72,
    autoPromoteBufferMinutes: 30,
    priorityWeights: {
      waitTime: 1.0,
      membershipLevel: 0.5,
      chronicCondition: 0.3,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchPolicy = useCallback(async () => {
    if (!doctor) {
      return;
    }
    setState({ kind: 'loading' });
    try {
      const response = await doctorWaitlistsApi.getPolicy();
      const policy = response.data;
      setFormData({
        maxQueueSize: policy.maxQueueSize ?? 250,
        autoExpiryHours: policy.autoExpiryHours ?? 72,
        autoPromoteBufferMinutes: policy.autoPromoteBufferMinutes ?? 30,
        priorityWeights: policy.priorityWeights ?? {
          waitTime: 1.0,
          membershipLevel: 0.5,
          chronicCondition: 0.3,
        },
      });
      setState({ kind: 'ready', policy });
    } catch (error) {
      console.error('[doctor] Failed to fetch waitlist policy', error);
      setState({
        kind: 'error',
        error: 'Unable to load policy settings. Please try again.',
      });
    }
  }, [doctor]);

  useEffect(() => {
    void fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = useCallback(async () => {
    if (!doctor) {
      return;
    }
    setIsSaving(true);
    try {
      await doctorWaitlistsApi.updatePolicy({
        maxQueueSize: formData.maxQueueSize,
        autoExpiryHours: formData.autoExpiryHours,
        autoPromoteBufferMinutes: formData.autoPromoteBufferMinutes,
        priorityWeights: formData.priorityWeights,
      });
      toast.success('Policy updated', {
        description: 'Waitlist policy settings have been saved.',
      });
      await fetchPolicy();
    } catch (error) {
      console.error('[doctor] Failed to update waitlist policy', error);
      toast.error('Unable to save policy', {
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsSaving(false);
    }
  }, [doctor, formData, fetchPolicy]);

  if (state.kind === 'loading' || state.kind === 'idle') {
    return <PolicyLoadingSkeleton />;
  }

  if (state.kind === 'error') {
    return (
      <Alert variant="destructive" className="rounded-lg">
        <AlertTitle>Settings unavailable</AlertTitle>
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Auto-Promotion Rules
        </CardTitle>
        <CardDescription>
          Configure automatic waitlist management rules and promotion settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <PolicyFormField
          id="maxQueueSize"
          label="Maximum Queue Size"
          value={formData.maxQueueSize}
          min={1}
          max={1000}
          description="Maximum number of patients that can be in the waitlist at once. Default: 250"
          onChange={(value) => setFormData((prev) => ({ ...prev, maxQueueSize: value }))}
        />

        <PolicyFormField
          id="autoExpiryHours"
          label="Auto-Expiry Hours"
          value={formData.autoExpiryHours}
          min={1}
          max={720}
          description="Hours after which waitlist entries automatically expire. Default: 72 hours (3 days)"
          onChange={(value) => setFormData((prev) => ({ ...prev, autoExpiryHours: value }))}
        />

        <PolicyFormField
          id="autoPromoteBufferMinutes"
          label="Auto-Promote Buffer (Minutes)"
          value={formData.autoPromoteBufferMinutes}
          min={0}
          max={1440}
          description="Buffer time in minutes before auto-promoting waitlist entries when slots become available. Default: 30 minutes"
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, autoPromoteBufferMinutes: value }))
          }
        />

        <PriorityWeightsSection
          weights={formData.priorityWeights ?? {}}
          onChange={(weights) => setFormData((prev) => ({ ...prev, priorityWeights: weights }))}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => fetchPolicy()}>
            Reset
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
