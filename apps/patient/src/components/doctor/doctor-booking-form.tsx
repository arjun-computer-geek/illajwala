"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { appointmentsApi } from "@/lib/api/appointments";
import { doctorsApi } from "@/lib/api/doctors";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import type { Doctor, ConsultationMode, PatientProfile, DoctorAvailability, DoctorAvailabilityDay } from "@/types/api";
import { patientsApi } from "@/lib/api/patients";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errors";
import type { BookAppointmentResponse } from "@/types/api";

type RazorpayCheckoutHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutFailure = {
  error: {
    description?: string;
    code?: string;
    reason?: string;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayCheckoutFailure) => void) => void;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, unknown>;
  handler: (response: RazorpayCheckoutHandlerResponse) => void;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.Razorpay !== "undefined") {
    return true;
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise.then((loaded) => loaded && typeof window.Razorpay !== "undefined");
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const loaded = await razorpayScriptPromise;
  return loaded && typeof window.Razorpay !== "undefined";
};

const bookingSchema = z.object({
  mode: z.string().min(1, "Select a consultation mode"),
  date: z.instanceof(Date, { message: "Select a preferred date" }),
  time: z.string().min(1, "Choose a time slot"),
  reason: z.string().max(500, "Please keep the reason under 500 characters").optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type DoctorBookingFormProps = {
  doctor: Doctor;
};

export const DoctorBookingForm = ({ doctor }: DoctorBookingFormProps) => {
  const { isAuthenticated, role, patient, token, setAuth } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const modes = useMemo<ConsultationMode[]>(() => {
    if (doctor.consultationModes && doctor.consultationModes.length > 0) {
      return doctor.consultationModes;
    }
    return ["clinic"];
  }, [doctor.consultationModes]);

  const availabilityParams = useMemo(() => ({ days: 14 }), []);

  const { data: availability, isLoading: availabilityLoading, isError: availabilityError, refetch: refetchAvailability } =
    useQuery<DoctorAvailability>({
      queryKey: queryKeys.doctorAvailability(doctor._id, availabilityParams),
      queryFn: () => doctorsApi.getAvailability(doctor._id, availabilityParams),
      staleTime: 5 * 60_000,
    });

  const availableSlotsByDate = useMemo(() => {
    const map = new Map<string, DoctorAvailabilityDay["slots"]>();
    if (!availability) {
      return map;
    }

    for (const day of availability.days ?? []) {
      const availableSlots = day.slots?.filter((slot) => slot.available) ?? [];
      if (availableSlots.length > 0) {
        const key = format(new Date(day.date), "yyyy-MM-dd");
        map.set(key, availableSlots);
      }
    }

    return map;
  }, [availability]);

  const { data: profile } = useQuery<PatientProfile>({
    queryKey: queryKeys.patientProfile,
    queryFn: patientsApi.me,
    enabled: isAuthenticated && role === "patient" && !patient,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (profile && token && role === "patient" && !patient) {
      setAuth({ token, role: "patient", patient: profile, tenantId: profile.tenantId });
    }
  }, [profile, token, role, patient, setAuth]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      mode: modes[0] ?? "clinic",
      time: "",
      reason: "",
    },
  });

  const selectedDate = form.watch("date");
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const slotsForSelectedDate = selectedDateKey ? availableSlotsByDate.get(selectedDateKey) ?? [] : [];

  useEffect(() => {
    if (!availability) {
      return;
    }

    const firstAvailableDay = availability.days.find((day) => day.slots?.some((slot) => slot.available));
    if (!firstAvailableDay) {
      return;
    }

    const currentDate = form.getValues("date");
    const currentTime = form.getValues("time");
    const currentDateKey = currentDate ? format(currentDate, "yyyy-MM-dd") : null;
    const currentDateSlots = currentDateKey ? availableSlotsByDate.get(currentDateKey) ?? [] : [];

    if (!currentDate || currentDateSlots.length === 0) {
      const dateValue = new Date(firstAvailableDay.date);
      form.setValue("date", dateValue, { shouldDirty: false, shouldValidate: true });
      const firstSlot = firstAvailableDay.slots?.find((slot) => slot.available);
      if (firstSlot) {
        form.setValue("time", firstSlot.start, { shouldDirty: false, shouldValidate: true });
      }
      return;
    }

    if (!currentTime || !currentDateSlots.some((slot) => slot.start === currentTime)) {
      const firstSlotForCurrentDate = currentDateSlots[0];
      if (firstSlotForCurrentDate) {
        form.setValue("time", firstSlotForCurrentDate.start, { shouldDirty: false, shouldValidate: true });
      }
    }
  }, [availability, availableSlotsByDate, form]);

  const activePatientProfile = patient ?? profile;
  const patientName = activePatientProfile?.name ?? "";
  const patientEmail = activePatientProfile?.email ?? "";
  const patientPhone = activePatientProfile?.phone ?? "";
  const patientId = activePatientProfile?._id;

  const startPaymentFlow = useCallback(
    async (result: BookAppointmentResponse) => {
      if (!result.payment) {
        return false;
      }

      setIsProcessingPayment(true);

      try {
        const scriptReady = await loadRazorpayScript();
        if (!scriptReady || !window.Razorpay) {
          toast.error("We couldn't load the payment gateway. Please try again in a moment.");
          return false;
        }

        const RazorpayCheckout = window.Razorpay;
        if (!RazorpayCheckout) {
          toast.error("Razorpay is not available right now. Please retry the payment shortly.");
          return false;
        }

        const appointment = result.appointment;
        const paymentOrder = result.payment;

        const success = await new Promise<boolean>((resolve) => {
          let settled = false;
          const settle = (value: boolean) => {
            if (!settled) {
              settled = true;
              resolve(value);
            }
          };

          const checkout = new RazorpayCheckout({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            name: "Illajwala VisitNow",
            description: `Appointment with ${doctor.name}`,
            order_id: paymentOrder.orderId,
            prefill: {
              name: patientName || undefined,
              email: patientEmail || undefined,
              contact: patientPhone || undefined,
            },
            notes: {
              appointmentId: appointment._id,
              doctorId: doctor._id,
            },
            handler: async (response: RazorpayCheckoutHandlerResponse) => {
              try {
                await appointmentsApi.confirmPayment(appointment._id, {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                });

                toast.success("Payment confirmed", {
                  description: "Your appointment is confirmed. You can review details in My Appointments.",
                });

                await Promise.all([
                  queryClient.invalidateQueries({ queryKey: queryKeys.appointments() }),
                  queryClient.invalidateQueries({ queryKey: queryKeys.doctorAvailability(doctor._id, availabilityParams) }),
                ]);

                router.push("/account/appointments");
                settle(true);
              } catch (error) {
                console.error("[patient] Failed to confirm Razorpay payment", error);
                toast.error(
                  getErrorMessage(
                    error,
                    "We received the payment but could not verify it automatically. Please contact support."
                  )
                );
                settle(false);
              }
            },
            modal: {
              ondismiss: () => {
                toast("Payment pending", {
                  description: "You can resume the payment anytime from My Appointments.",
                });
                settle(false);
              },
            },
            theme: {
              color: "#2563eb",
            },
          });

          checkout.on("payment.failed", (event: RazorpayCheckoutFailure) => {
            console.error("[patient] Razorpay payment failed", event.error);
            toast.error(event.error.description ?? "Payment failed. Please try again.");
            settle(false);
          });

          checkout.open();
        });

        return success;
      } finally {
        setIsProcessingPayment(false);
      }
    },
    [
      availabilityParams,
      doctor._id,
      doctor.name,
      patientEmail,
      patientName,
      patientPhone,
      queryClient,
      router,
    ]
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!isAuthenticated || role !== "patient") {
      toast("Please sign in as a patient to book this doctor.");
      router.push("/auth/patient/login");
      return;
    }

    if (!patientId) {
      toast.error("We could not verify your patient profile. Please try signing in again.");
      return;
    }

    const scheduledAt = new Date(values.time);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error("The selected slot is no longer valid. Please pick another time.");
      return;
    }

    try {
      const result: BookAppointmentResponse = await appointmentsApi.create({
        doctorId: doctor._id,
        patientId,
        scheduledAt: scheduledAt.toISOString(),
        mode: values.mode as ConsultationMode,
        reasonForVisit: values.reason,
      });

      if (result.payment) {
        const paymentCompleted = await startPaymentFlow(result);
        if (!paymentCompleted) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.appointments() });
        }
        return;
      }

      toast.success("Appointment booked successfully! We will keep you updated.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.doctorAvailability(doctor._id, availabilityParams) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.appointments() }),
      ]);
      router.push("/account/appointments");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't confirm the booking. Please try again in a moment."));
    }
  });

  const slotSelectionDisabled =
    availabilityLoading ||
    availabilityError ||
    !availability ||
    availableSlotsByDate.size === 0 ||
    isProcessingPayment;

  const calendarDisabledBefore = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const hasSlots = availableSlotsByDate.has(dateKey);
      return date < startOfToday || !hasSlots;
    };
  }, [availableSlotsByDate]);

  if (!isAuthenticated || role !== "patient") {
    return (
      <div className="rounded-2xl bg-muted/40 p-6 text-center shadow-[0_18px_44px_-26px_rgba(15,23,42,0.55)] dark:bg-background/80 dark:text-muted-foreground/90 dark:shadow-[0_26px_58px_-28px_rgba(2,6,23,0.8)] dark:ring-1 dark:ring-primary/20">
        <h3 className="text-lg font-semibold text-foreground">Book this doctor</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to choose a slot, track confirmations, and receive live visit updates.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" type="button" onClick={() => router.push("/auth/patient/login")}>
            Sign in
          </Button>
          <Button type="button" onClick={() => router.push("/auth/patient/register")}>
            Create account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-background p-6 shadow-xl shadow-primary/10 dark:bg-card/95 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Book an appointment</h3>
          <p className="text-sm text-muted-foreground">
            Select a convenient slot and we will confirm instantly with {doctor.name}.
          </p>
        </div>

        {availabilityLoading ? (
          <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
            Checking live availability...
          </div>
        ) : null}

        {availabilityError ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            We could not load the upcoming slots.{" "}
            <button
              type="button"
              onClick={() => refetchAvailability()}
              className="font-semibold underline"
            >
              Retry
            </button>
            .
          </div>
        ) : null}

        {!availabilityLoading && !availabilityError && availableSlotsByDate.size === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            {doctor.name} has no open slots in the next two weeks. Try a different doctor or check back soon.
          </div>
        ) : null}

        <FormField
          control={form.control}
          name="mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Consultation mode</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mode" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {modes.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {mode.replace("-", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
                          "w-full justify-between text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={slotSelectionDisabled}
                      >
                        {field.value ? format(field.value, "EEE, dd MMM yyyy") : "Pick a date"}
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
                        form.setValue("time", "", { shouldDirty: true });
                      }}
                      disabled={calendarDisabledBefore}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time slot</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={slotSelectionDisabled || slotsForSelectedDate.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          slotSelectionDisabled
                            ? "Slots unavailable"
                            : slotsForSelectedDate.length === 0
                              ? "No slots for this day"
                              : "Select a slot"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {slotsForSelectedDate.map((slot) => (
                      <SelectItem key={slot.start} value={slot.start}>
                        {format(new Date(slot.start), "hh:mm a")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for visit (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mention symptoms, follow-up requests, or anything the doctor should know."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={
            form.formState.isSubmitting ||
            isProcessingPayment ||
            slotSelectionDisabled ||
            !form.getValues("time")
          }
        >
          {isProcessingPayment ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing payment...
            </span>
          ) : form.formState.isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Booking...
            </span>
          ) : (
            "Confirm appointment"
          )}
        </Button>
      </form>
    </Form>
  );
};


