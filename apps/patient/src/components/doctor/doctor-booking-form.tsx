"use client";

import { useEffect, useMemo } from "react";
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
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import type { Doctor, ConsultationMode, PatientProfile } from "@/types/api";
import { patientsApi } from "@/lib/api/patients";
import { format } from "date-fns";
import { getErrorMessage } from "@/lib/errors";

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:30", "17:00", "19:00"];

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

  const modes = useMemo<ConsultationMode[]>(() => {
    if (doctor.consultationModes && doctor.consultationModes.length > 0) {
      return doctor.consultationModes;
    }
    return ["clinic"];
  }, [doctor.consultationModes]);

  const { data: profile } = useQuery<PatientProfile>({
    queryKey: queryKeys.patientProfile,
    queryFn: patientsApi.me,
    enabled: isAuthenticated && role === "patient" && !patient,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (profile && token && role === "patient" && !patient) {
      setAuth({ token, role: "patient", patient: profile });
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

  const patientId = patient?._id ?? profile?._id;

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

    const [hours, minutes] = values.time.split(":").map(Number);
    const scheduledAt = new Date(values.date);
    scheduledAt.setHours(hours);
    scheduledAt.setMinutes(minutes);
    scheduledAt.setSeconds(0, 0);

    try {
      await appointmentsApi.create({
        doctorId: doctor._id,
        patientId,
        scheduledAt: scheduledAt.toISOString(),
        mode: values.mode as ConsultationMode,
        reasonForVisit: values.reason,
      });

      toast.success("Appointment booked successfully! We will keep you updated.");
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments() });
      router.push("/account/appointments");
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't confirm the booking. Please try again in a moment."));
    }
  });

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
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a slot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
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

        <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
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


