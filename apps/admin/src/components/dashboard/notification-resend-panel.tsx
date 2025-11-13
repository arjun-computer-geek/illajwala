"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@illajwala/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { Clock9, Send, Share, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { adminNotificationsApi } from "@/lib/api/notifications";
import { adminQueryKeys } from "@/lib/query-keys";
import type { NotificationAuditEntry, NotificationChannel } from "@/types/admin";

const channelOptions: { value: NotificationChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
];

const buildSamplePayload = (
  channel: NotificationChannel,
  recipient?: string,
  template?: string
) => {
  switch (channel) {
    case "email":
      return JSON.stringify(
        {
          to: recipient ?? "patient@example.com",
          subject: template ? `Re: ${template}` : "Follow-up notification",
          html:
            "<p>Hi there,<br/>Following up on your consultation. Let us know if you need anything else.</p>",
          text: "Hi there, following up on your consultation. Let us know if you need anything else.",
        },
        null,
        2
      );
    case "sms":
      return JSON.stringify(
        {
          to: recipient ?? "+91-90000-00000",
          message: template
            ? `Follow-up regarding ${template}. Reply if you need to reschedule.`
            : "Follow-up reminder from Illajwala. Reply if you need assistance.",
        },
        null,
        2
      );
    case "whatsapp":
      return JSON.stringify(
        {
          to: recipient ?? "+91-90000-00000",
          message:
            "Hi! Checking in from Illajwala. Let us know if you need to reschedule or have questions about your visit.",
        },
        null,
        2
      );
    default:
      return "{}";
  }
};

export const NotificationResendPanel = () => {
  const queryClient = useQueryClient();
  const [selectedLog, setSelectedLog] = useState<NotificationAuditEntry | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [channel, setChannel] = useState<NotificationChannel>("email");
  const [payload, setPayload] = useState("");
  const [reason, setReason] = useState("");

  const { data: recentLogs, isLoading, isError } = useQuery({
    queryKey: adminQueryKeys.notificationAudit(),
    queryFn: adminNotificationsApi.getRecentAudit,
    staleTime: 60_000,
  });

  const resendMutation = useMutation({
    mutationFn: adminNotificationsApi.resendNotification,
    onSuccess: () => {
      toast.success("Resend queued", {
        description: "Support can track status from the audit log below.",
      });
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.notificationAudit() });
      setIsComposerOpen(false);
      setPayload("");
      setReason("");
    },
    onError: () => {
      toast.error("Unable to queue resend. Please try again or contact messaging support.");
    },
  });

  const composerDisabled = resendMutation.isPending || !payload.trim();

  const fallbackLogs = useMemo<NotificationAuditEntry[]>(() => {
    if (recentLogs) {
      return recentLogs;
    }
    return [
      {
        id: "stub-email-1",
        channel: "email",
        template: "consultation-confirmation",
        recipient: "patient@example.com",
        status: "delivered",
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        actor: "Auto",
        reason: null,
      },
      {
        id: "stub-sms-1",
        channel: "sms",
        template: "consultation-reminder",
        recipient: "+91-90000-11111",
        status: "failed",
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        actor: "Support",
        reason: "Gateway provider outage",
      },
    ];
  }, [recentLogs]);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Notification overrides
        </CardTitle>
        <CardDescription>
          Resend failed reminders across channels and maintain a full audit trail for compliance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          size="sm"
          className="gap-2 rounded-full px-4 text-xs"
          onClick={() => {
            setSelectedLog(null);
            setChannel("email");
            setPayload(buildSamplePayload("email"));
            setReason("");
            setIsComposerOpen(true);
          }}
        >
          <Send className="h-3.5 w-3.5" />
          New resend
        </Button>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Recent audit log</h3>
          {isLoading && !recentLogs ? (
            <p className="text-xs text-muted-foreground">Loading recent override activity…</p>
          ) : isError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
              We couldn&apos;t load the notification audit log. Verify the messaging service is reachable.
            </div>
          ) : (
            <div className="space-y-3">
              {fallbackLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                      {entry.channel}
                    </Badge>
                    <span className="text-xs font-medium text-foreground">{entry.template}</span>
                    <Badge
                      variant={entry.status === "delivered" ? "secondary" : entry.status === "failed" ? "destructive" : "outline"}
                      className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
                    >
                      {entry.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/90">
                    <span>{entry.recipient}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock9 className="h-3.5 w-3.5 text-primary" />
                      {formatDistanceToNowStrict(new Date(entry.createdAt), { addSuffix: true })}
                    </span>
                    <span>Actor: {entry.actor ?? "System"}</span>
                  </div>
                  {entry.reason ? (
                    <p className="text-xs text-muted-foreground/80">Reason: {entry.reason}</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 rounded-full px-4 text-xs"
                      onClick={() => {
                        setSelectedLog(entry);
                        setChannel(entry.channel);
                        setPayload(buildSamplePayload(entry.channel, entry.recipient, entry.template));
                        setReason(`Follow-up for ${entry.id}`);
                        setIsComposerOpen(true);
                      }}
                    >
                      <Share className="h-3.5 w-3.5" />
                      Resend
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="rounded-full px-4 text-xs">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Audit export coming soon", {
                              description: "Exports will be available once analytics exporters land.",
                            })
                          }
                        >
                          Export JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Escalation routing coming soon", {
                              description: "Escalations will integrate with the ops on-call system.",
                            })
                          }
                        >
                          Escalate to on-call
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground/80">
        Overrides are logged with actor, channel, and reason to maintain compliance visibility.
      </CardFooter>

      <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Queue a resend</DialogTitle>
            <DialogDescription>
              Choose a channel and payload to re-dispatch to the messaging service. All actions are audited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="notification-channel">Channel</Label>
              <Select
                value={channel}
                onValueChange={(value) => {
                  const nextChannel = value as NotificationChannel;
                  setChannel(nextChannel);
                  if (!payload.trim()) {
                    setPayload(buildSamplePayload(nextChannel, selectedLog?.recipient, selectedLog?.template));
                  }
                }}
              >
                <SelectTrigger id="notification-channel" className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-payload">Payload JSON</Label>
              <Textarea
                id="notification-payload"
                placeholder='{"template":"consultation-reminder","metadata":{...}}'
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notification-reason">Reason / ticket (optional)</Label>
              <Input
                id="notification-reason"
                placeholder="Eg. Support ticket #12345, patient requested resend"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            {selectedLog ? (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground/90">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  Replaying entry
                </p>
                <p>ID: {selectedLog.id}</p>
                <p>Original status: {selectedLog.status}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsComposerOpen(false)} disabled={resendMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                resendMutation.mutate({
                  channel,
                  payload,
                  reason: reason.trim() || undefined,
                  replayOf: selectedLog?.id,
                })
              }
              disabled={composerDisabled}
            >
              Queue resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};


