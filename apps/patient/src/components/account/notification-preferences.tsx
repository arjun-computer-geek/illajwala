"use client";

import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Mail, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { patientsApi } from "@/lib/api/patients";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import type { NotificationHistoryEntry, NotificationPreferences } from "@/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const channelCopy: Record<keyof NotificationPreferences, { label: string; description: string; icon: ReactNode }> = {
  emailReminders: {
    label: "Email reminders",
    description: "Confirmations, summaries, and follow-up instructions.",
    icon: <Mail className="h-4 w-4 text-primary" />,
  },
  smsReminders: {
    label: "SMS alerts",
    description: "Same-day reminders and critical scheduling changes.",
    icon: <Phone className="h-4 w-4 text-primary" />,
  },
  whatsappReminders: {
    label: "WhatsApp",
    description: "Visit reminders and quick support nudges.",
    icon: <MessageCircle className="h-4 w-4 text-primary" />,
  },
};

const statusVariant: Record<NotificationHistoryEntry["status"], "default" | "secondary" | "destructive" | "outline"> = {
  queued: "outline",
  sent: "secondary",
  delivered: "default",
  failed: "destructive",
};

const channelBadgeVariant: Record<NotificationHistoryEntry["channel"], "default" | "secondary" | "outline"> = {
  email: "default",
  sms: "secondary",
  whatsapp: "outline",
};

export const NotificationPreferencesPanel = () => {
  const { hydrated, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: preferences,
    isLoading: preferencesLoading,
    isError: preferencesError,
  } = useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: patientsApi.getNotificationPreferences,
    enabled: hydrated && isAuthenticated,
  });

  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
  } = useQuery({
    queryKey: queryKeys.notificationHistory,
    queryFn: patientsApi.getNotificationHistory,
    enabled: hydrated && isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: patientsApi.updateNotificationPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, data);
      toast.success("Notification preferences updated");
    },
    onError: () => {
      toast.error("Unable to update preferences. Please try again soon.");
    },
  });

  const toggleChannel = (channel: keyof NotificationPreferences) => {
    if (!preferences) {
      return;
    }
    updateMutation.mutate({
      [channel]: !preferences[channel],
    });
  };

  const isSaving = updateMutation.isPending;

  return (
    <Card className="rounded-3xl border border-border/60 bg-background/80 shadow-md shadow-primary/5 backdrop-blur">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="h-5 w-5 text-primary" />
            Notification preferences
          </CardTitle>
          <CardDescription>Choose how you want to be kept in the loop about upcoming visits.</CardDescription>
        </div>
        {isSaving ? (
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em]">
            Saving…
          </Badge>
        ) : preferencesError ? (
          <Badge variant="destructive" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em]">
            Error syncing
          </Badge>
        ) : preferences ? (
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-[0.25em]">
            Synced
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {preferencesLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))
          ) : preferencesError ? (
            <div className="col-span-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              We weren&apos;t able to load your preferences. Retry shortly.
            </div>
          ) : preferences ? (
            (Object.keys(channelCopy) as Array<keyof NotificationPreferences>).map((channel) => {
              const channelState = channelCopy[channel];
              const active = preferences[channel];
              return (
                <div
                  key={channel}
                  className="flex h-full flex-col justify-between rounded-2xl border border-border/40 bg-muted/40 p-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {channelState.icon}
                      {channelState.label}
                    </div>
                    <p className="text-xs text-muted-foreground/90">{channelState.description}</p>
                  </div>
                  <Button
                    variant={active ? "secondary" : "outline"}
                    className="mt-4 rounded-full px-4 text-xs uppercase tracking-[0.3em]"
                    aria-pressed={active}
                    onClick={() => toggleChannel(channel)}
                    disabled={isSaving}
                  >
                    {active ? "Enabled" : "Enable"}
                  </Button>
                </div>
              );
            })
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Recent notifications</p>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
              History
            </Badge>
          </div>
          {historyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-2xl" />
              ))}
            </div>
          ) : historyError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              Unable to load notification history right now.
            </div>
          ) : history && history.length > 0 ? (
            <ul className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-background/60 px-4 py-3 text-xs text-muted-foreground/90"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={channelBadgeVariant[entry.channel]} className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                      {entry.channel}
                    </Badge>
                    <span className="font-medium text-foreground">{entry.template}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={statusVariant[entry.status]}
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                    >
                      {entry.status}
                    </Badge>
                    <span>
                      {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-border/40 bg-muted/30 p-4 text-xs text-muted-foreground">
              No notifications sent yet. We&apos;ll display the latest delivery status once reminders go out.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};


