"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@illajwala/ui";
import type { Appointment, AppointmentPaymentStatus, AppointmentStatus } from "@illajwala/types";
import { RefreshCw, CreditCard, XCircle, AlertCircle, Clock, PlayCircle, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  appointmentsApi,
  type UpdateAppointmentStatusPayload,
  type UpdateAppointmentPaymentPayload,
} from "../../lib/api/appointments";
import { useAdminAuth } from "../../hooks/use-auth";

type AppointmentWithPatient = Appointment & {
  patient?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

// Centralised label map keeps the badge, filter, and toasts consistent as the
// consultation state machine grows.
const statusLabels: Record<AppointmentStatus, string> = {
  "pending-payment": "Pending payment",
  confirmed: "Confirmed",
  "checked-in": "Checked in",
  "in-session": "In session",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No show",
};

const statusVariants: Record<AppointmentStatus, "outline" | "secondary" | "default" | "destructive"> = {
  "pending-payment": "outline",
  confirmed: "secondary",
  "checked-in": "secondary",
  "in-session": "secondary",
  completed: "default",
  cancelled: "destructive",
  "no-show": "destructive",
};

const statusFilterOptions: Array<{ value: AppointmentStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "pending-payment", label: "Pending payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked-in", label: "Checked in" },
  { value: "in-session", label: "In session" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no-show", label: "No show" },
];

const amountFromMinor = (amount?: number | null) =>
  typeof amount === "number" && Number.isFinite(amount) ? (amount / 100).toFixed(2) : undefined;

const paymentStatusLabels: Record<AppointmentPaymentStatus, string> = {
  pending: "Pending",
  authorized: "Authorized",
  captured: "Captured",
  failed: "Failed",
};

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const formatTimeLabel = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export const BookingsTable = () => {
  const { admin } = useAdminAuth();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await appointmentsApi.list(
        statusFilter === "all"
          ? { pageSize: 20 }
          : {
              pageSize: 20,
              status: statusFilter,
            }
      );
      setAppointments(response.data as AppointmentWithPatient[]);
    } catch (error) {
      console.error("[admin] Failed to fetch appointments", error);
      toast.error("Unable to load bookings", {
        description: "Please try again or check the identity-service.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
  };

  const applyStatusUpdate = useCallback(
    async (appointment: AppointmentWithPatient, payload: UpdateAppointmentStatusPayload) => {
      try {
        setProcessingId(appointment._id);
        const updated = await appointmentsApi.updateStatus(appointment._id, payload);
        setAppointments((current) => current.map((item) => (item._id === updated._id ? (updated as AppointmentWithPatient) : item)));
        toast.success("Appointment updated", {
          description: `Status set to ${statusLabels[payload.status]}`,
        });
      } catch (error) {
        console.error("[admin] Failed to update appointment status", error);
        toast.error("Unable to update appointment", {
          description: "Please retry. If the issue persists, contact the platform team.",
        });
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const handleManualStatus = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentStatus) => {
      const defaultNote =
        status === "confirmed"
          ? `Manual confirmation by ${admin?.name ?? admin?.email ?? "Admin"}`
          : status === "checked-in"
            ? `Marked checked-in by ${admin?.name ?? admin?.email ?? "Admin"}`
            : status === "in-session"
              ? `Marked in-session by ${admin?.name ?? admin?.email ?? "Admin"}`
              : status === "cancelled"
                ? `Manual cancellation by ${admin?.name ?? admin?.email ?? "Admin"}`
                : status === "no-show"
                  ? `Marked no-show by ${admin?.name ?? admin?.email ?? "Admin"}`
                  : undefined;

      const note =
        typeof window !== "undefined"
          ? window.prompt("Add an optional note for this manual action:", defaultNote ?? "")
          : defaultNote;

      if (note === null) {
        return;
      }

      void applyStatusUpdate(appointment, {
        status,
        notes: note?.trim() ? note.trim() : undefined,
      });
    },
    [admin?.email, admin?.name, applyStatusUpdate]
  );

  const applyPaymentUpdate = useCallback(
    async (appointment: AppointmentWithPatient, payload: UpdateAppointmentPaymentPayload) => {
      try {
        setProcessingId(appointment._id);
        const updated = await appointmentsApi.updatePayment(appointment._id, payload);
        setAppointments((current) => current.map((item) => (item._id === updated._id ? (updated as AppointmentWithPatient) : item)));
        toast.success("Payment status updated", {
          description: `Payment marked ${paymentStatusLabels[payload.status]}`,
        });
      } catch (error) {
        console.error("[admin] Failed to update payment status", error);
        toast.error("Unable to update payment status", {
          description: "Please retry. If this persists, contact the platform team.",
        });
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const handleManualPayment = useCallback(
    (appointment: AppointmentWithPatient, status: AppointmentPaymentStatus) => {
      const defaultNote =
        status === "captured"
          ? `Payment marked captured by ${admin?.name ?? admin?.email ?? "Admin"}`
          : status === "failed"
            ? `Payment marked failed by ${admin?.name ?? admin?.email ?? "Admin"}`
            : undefined;

      const note =
        typeof window !== "undefined"
          ? window.prompt("Add an optional note for this payment action:", defaultNote ?? "")
          : defaultNote;

      if (note === null) {
        return;
      }

      void applyPaymentUpdate(appointment, {
        status,
        notes: note?.trim() ? note.trim() : undefined,
      });
    },
    [admin?.email, admin?.name, applyPaymentUpdate]
  );

  const appointmentsContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-lg" />
          ))}
        </div>
      );
    }

    if (appointments.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
          No appointments found for the selected filters.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {appointments.map((appointment) => {
          const paymentAmount = amountFromMinor(appointment.payment?.amount);
          const scheduledDate = formatDateLabel(appointment.scheduledAt);
          const scheduledTime = formatTimeLabel(appointment.scheduledAt);
          const paymentStatus = appointment.payment?.status ?? "pending";

          return (
            <div
              key={appointment._id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-background/40 px-5 py-4 transition-colors hover:border-primary/40 hover:bg-background/60"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    {appointment.doctor.name} · {appointment.doctor.specialization}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Patient: {appointment.patient?.name ?? "Unknown"} · {appointment.patient?.email ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    {scheduledDate} at {scheduledTime} · Mode {appointment.mode}
                  </p>
                </div>
                <Badge
                  variant={statusVariants[appointment.status] ?? "outline"}
                  className="w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em]"
                >
                  {statusLabels[appointment.status]}
                </Badge>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-4">
                <div>
          <p className="font-medium text-foreground">Payment status</p>
                  <p>{paymentStatusLabels[paymentStatus]}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Amount</p>
                  <p>{paymentAmount ? `₹${paymentAmount}` : "—"}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Order ID</p>
                  <p className="break-all text-[11px]">
                    {appointment.payment?.orderId ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Payment ID</p>
                  <p className="break-all text-[11px]">{appointment.payment?.paymentId ?? "—"}</p>
                </div>
              </div>

              {appointment.notes ? (
                <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                  {appointment.notes}
                </div>
              ) : null}

              {/* Action row keeps manual controls visible for ops whenever automated flows fail. */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualPayment(appointment, "captured")}
                  disabled={processingId === appointment._id || paymentStatus === "captured"}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Mark payment captured
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualPayment(appointment, "failed")}
                  disabled={processingId === appointment._id || paymentStatus === "failed"}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Mark payment failed
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualStatus(appointment, "checked-in")}
                  disabled={processingId === appointment._id || appointment.status === "checked-in"}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Mark checked in
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualStatus(appointment, "in-session")}
                  disabled={processingId === appointment._id || appointment.status === "in-session"}
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  Mark in session
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualStatus(appointment, "no-show")}
                  disabled={processingId === appointment._id || appointment.status === "no-show"}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Mark no-show
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 rounded-full px-4 text-xs"
                  onClick={() => handleManualStatus(appointment, "cancelled")}
                  disabled={processingId === appointment._id || appointment.status === "cancelled"}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Cancel appointment
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [appointments, handleManualPayment, handleManualStatus, isLoading, processingId]);

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Booking oversight
            </CardTitle>
            <CardDescription>Track appointments, payment outcomes, and perform manual overrides.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}
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
              onClick={() => handleRefresh()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{appointmentsContent}</CardContent>
    </Card>
  );
};


