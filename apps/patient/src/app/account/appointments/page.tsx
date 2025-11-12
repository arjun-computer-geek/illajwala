import { AppointmentsList } from "@/components/account/appointments-list";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My appointments",
  description: "Track your upcoming and past appointments with real-time status updates.",
};

export default function AppointmentsPage() {
  return (
    <div className="container space-y-10 py-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Manage appointments, reschedule, cancel, and join telehealth sessions from a single dashboard.
        </p>
      </div>
      <AppointmentsList />
    </div>
  );
}

