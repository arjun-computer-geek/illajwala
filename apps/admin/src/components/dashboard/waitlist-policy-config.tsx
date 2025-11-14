"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
} from "@illajwala/ui";
import { adminWaitlistsApi } from "@/lib/api/waitlists";
import { adminClinicsApi } from "@/lib/api/clinics";
import { adminQueryKeys } from "@/lib/query-keys";
import type { WaitlistPolicy, Clinic } from "@illajwala/types";

type PolicyFormData = {
  maxQueueSize: string;
  autoExpiryHours: string;
  autoPromoteBufferMinutes: string;
  priorityWeights: {
    waitTime: string;
    membershipLevel: string;
    chronicCondition: string;
  };
  notificationTemplateOverrides: {
    joined: string;
    invited: string;
    promoted: string;
    expired: string;
  };
  notes: string;
};

export const WaitlistPolicyConfig = () => {
  const queryClient = useQueryClient();
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PolicyFormData>({
    maxQueueSize: "250",
    autoExpiryHours: "72",
    autoPromoteBufferMinutes: "30",
    priorityWeights: {
      waitTime: "1.0",
      membershipLevel: "0.5",
      chronicCondition: "0.3",
    },
    notificationTemplateOverrides: {
      joined: "",
      invited: "",
      promoted: "",
      expired: "",
    },
    notes: "",
  });

  const clinicsQuery = useQuery({
    queryKey: adminQueryKeys.clinics(),
    queryFn: () => adminClinicsApi.list({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  const policyQuery = useQuery({
    queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId),
    queryFn: () => adminWaitlistsApi.getPolicy(selectedClinicId ?? undefined),
    enabled: true,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (policyQuery.data) {
      const policy = policyQuery.data;
      setFormData({
        maxQueueSize: String(policy.maxQueueSize ?? 250),
        autoExpiryHours: String(policy.autoExpiryHours ?? 72),
        autoPromoteBufferMinutes: String(policy.autoPromoteBufferMinutes ?? 30),
        priorityWeights: {
          waitTime: String((policy.priorityWeights as { waitTime?: number })?.waitTime ?? 1.0),
          membershipLevel: String((policy.priorityWeights as { membershipLevel?: number })?.membershipLevel ?? 0.5),
          chronicCondition: String((policy.priorityWeights as { chronicCondition?: number })?.chronicCondition ?? 0.3),
        },
        notificationTemplateOverrides: {
          joined: policy.notificationTemplateOverrides?.joined ?? "",
          invited: policy.notificationTemplateOverrides?.invited ?? "",
          promoted: policy.notificationTemplateOverrides?.promoted ?? "",
          expired: policy.notificationTemplateOverrides?.expired ?? "",
        },
        notes: "",
      });
    }
  }, [policyQuery.data, selectedClinicId]);

  const saveMutation = useMutation({
    mutationFn: async (data: PolicyFormData) => {
      const payload: Parameters<typeof adminWaitlistsApi.upsertPolicy>[0] = {
        clinicId: selectedClinicId ?? undefined,
        maxQueueSize: Number(data.maxQueueSize),
        autoExpiryHours: Number(data.autoExpiryHours),
        autoPromoteBufferMinutes: Number(data.autoPromoteBufferMinutes),
        priorityWeights: {
          waitTime: Number(data.priorityWeights.waitTime) || 1.0,
          membershipLevel: Number(data.priorityWeights.membershipLevel) || 0.5,
          chronicCondition: Number(data.priorityWeights.chronicCondition) || 0.3,
        },
        notificationTemplateOverrides: Object.fromEntries(
          Object.entries(data.notificationTemplateOverrides).filter(([_, v]) => v.trim().length > 0)
        ) as Record<string, string>,
      };
      return adminWaitlistsApi.upsertPolicy(payload);
    },
    onSuccess: () => {
      toast.success("Waitlist policy updated", {
        description: selectedClinicId ? "Clinic-specific policy saved." : "Global policy saved.",
      });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.waitlistPolicy(selectedClinicId) });
    },
    onError: (error) => {
      toast.error("Failed to save policy", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    },
  });

  const handleSave = () => {
    const maxQueueSize = Number(formData.maxQueueSize);
    const autoExpiryHours = Number(formData.autoExpiryHours);
    const autoPromoteBufferMinutes = Number(formData.autoPromoteBufferMinutes);

    if (!Number.isFinite(maxQueueSize) || maxQueueSize <= 0) {
      toast.error("Invalid max queue size");
      return;
    }

    if (!Number.isFinite(autoExpiryHours) || autoExpiryHours <= 0) {
      toast.error("Invalid auto expiry hours");
      return;
    }

    if (!Number.isFinite(autoPromoteBufferMinutes) || autoPromoteBufferMinutes <= 0) {
      toast.error("Invalid auto promote buffer minutes");
      return;
    }

    saveMutation.mutate(formData);
  };

  const clinics = clinicsQuery.data?.data ?? [];
  const selectedClinic = clinics.find((c) => c._id === selectedClinicId);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Waitlist Policy Configuration
        </CardTitle>
        <CardDescription>
          Configure waitlist behavior, capacity limits, and prioritization rules. Policies can be set globally or per-clinic.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="clinic-select">Policy Scope</Label>
          <Select
            value={selectedClinicId ?? "global"}
            onValueChange={(value) => setSelectedClinicId(value === "global" ? null : value)}
          >
            <SelectTrigger id="clinic-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (All Clinics)</SelectItem>
              {clinics.map((clinic) => (
                <SelectItem key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedClinic && (
            <p className="text-xs text-muted-foreground">
              Configuring policy for <strong>{selectedClinic.name}</strong>. This will override the global policy.
            </p>
          )}
        </div>

        {policyQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max-queue-size">Max Queue Size</Label>
                <Input
                  id="max-queue-size"
                  type="number"
                  min="1"
                  value={formData.maxQueueSize}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxQueueSize: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Maximum number of active waitlist entries allowed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-expiry-hours">Auto Expiry (Hours)</Label>
                <Input
                  id="auto-expiry-hours"
                  type="number"
                  min="1"
                  value={formData.autoExpiryHours}
                  onChange={(e) => setFormData((prev) => ({ ...prev, autoExpiryHours: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Hours before inactive entries automatically expire.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-promote-buffer">Auto Promote Buffer (Minutes)</Label>
                <Input
                  id="auto-promote-buffer"
                  type="number"
                  min="1"
                  value={formData.autoPromoteBufferMinutes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, autoPromoteBufferMinutes: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Buffer time before auto-promoting entries.</p>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <Label className="text-base">Priority Scoring Weights</Label>
              <p className="text-xs text-muted-foreground">
                Adjust how different factors contribute to waitlist priority. Higher weights = higher priority.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="weight-wait-time">Wait Time Weight</Label>
                  <Input
                    id="weight-wait-time"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.priorityWeights.waitTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priorityWeights: { ...prev.priorityWeights, waitTime: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight-membership">Membership Level Weight</Label>
                  <Input
                    id="weight-membership"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.priorityWeights.membershipLevel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priorityWeights: { ...prev.priorityWeights, membershipLevel: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight-chronic">Chronic Condition Weight</Label>
                  <Input
                    id="weight-chronic"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.priorityWeights.chronicCondition}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        priorityWeights: { ...prev.priorityWeights, chronicCondition: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <Label className="text-base">Notification Template Overrides (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Customize notification messages. Leave empty to use default templates. Use placeholders:{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">{"{patientName}"}</code>,{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">{"{doctorName}"}</code>,{" "}
                <code className="rounded bg-background px-1 py-0.5 text-xs">{"{clinicName}"}</code>
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="template-joined">Joined Waitlist Template</Label>
                  <Textarea
                    id="template-joined"
                    value={formData.notificationTemplateOverrides.joined}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notificationTemplateOverrides: { ...prev.notificationTemplateOverrides, joined: e.target.value },
                      }))
                    }
                    rows={2}
                    placeholder="Default: You've been added to the waitlist..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-invited">Invited Template</Label>
                  <Textarea
                    id="template-invited"
                    value={formData.notificationTemplateOverrides.invited}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notificationTemplateOverrides: { ...prev.notificationTemplateOverrides, invited: e.target.value },
                      }))
                    }
                    rows={2}
                    placeholder="Default: A slot is available..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-promoted">Promoted Template</Label>
                  <Textarea
                    id="template-promoted"
                    value={formData.notificationTemplateOverrides.promoted}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notificationTemplateOverrides: { ...prev.notificationTemplateOverrides, promoted: e.target.value },
                      }))
                    }
                    rows={2}
                    placeholder="Default: Your waitlist entry has been converted..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-expired">Expired Template</Label>
                  <Textarea
                    id="template-expired"
                    value={formData.notificationTemplateOverrides.expired}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notificationTemplateOverrides: { ...prev.notificationTemplateOverrides, expired: e.target.value },
                      }))
                    }
                    rows={2}
                    placeholder="Default: Your waitlist entry has expired..."
                  />
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Policy Precedence</AlertTitle>
              <AlertDescription className="text-xs">
                Clinic-specific policies override global policies. If no clinic policy exists, the global policy applies.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => policyQuery.refetch()}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Policy
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

