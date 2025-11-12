import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Doctor } from "@/types/api";
import { Calendar, Clock, Globe, MapPin } from "lucide-react";
import { DoctorBookingForm } from "./doctor-booking-form";

type DoctorProfileProps = {
  doctor: Doctor;
};

export const DoctorProfile = ({ doctor }: DoctorProfileProps) => {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-background p-6 shadow-xl shadow-primary/10 transition-transform duration-200 lg:p-10 dark:bg-card/95 dark:shadow-[0_28px_62px_-30px_rgba(2,6,23,0.85)] dark:ring-1 dark:ring-primary/20">
        <div className="grid gap-8 lg:grid-cols-[2fr,1.2fr]">
          <div className="space-y-6">
            <div>
              <Badge variant="outline" className="mb-3">
                {doctor.specialization}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground">{doctor.name}</h1>
              {doctor.about && <p className="mt-3 max-w-2xl text-muted-foreground">{doctor.about}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(doctor.consultationModes ?? ["clinic"]).map((mode) => (
                <Badge key={mode} variant="secondary" className="capitalize">
                  {mode.replace("-", " ")}
                </Badge>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <InfoBlock
                icon={<Calendar className="h-5 w-5" />}
                title="Experience"
                description={`${doctor.experienceYears ?? 5}+ years in practice`}
              />
              <InfoBlock
                icon={<Globe className="h-5 w-5" />}
                title="Languages"
                description={doctor.languages?.join(", ") ?? "English, Hindi"}
              />
              <InfoBlock
                icon={<Clock className="h-5 w-5" />}
                title="Consultation fee"
                description={`₹${doctor.fee ?? 1200}`}
              />
            </div>
          </div>

          <DoctorBookingForm doctor={doctor} />
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Clinics & availability</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {doctor.clinicLocations?.map((clinic) => (
            <Card key={`${clinic.name}-${clinic.address}`}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <MapPin className="h-4 w-4" />
                  {clinic.name}
                </div>
                <p className="text-sm text-muted-foreground">{clinic.address}</p>
                <Badge variant="outline" className="mt-2">
                  {clinic.city}
                </Badge>
              </CardContent>
            </Card>
          )) ?? <EmptyClinics />}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-2xl font-semibold text-foreground">Patient feedback</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Patient reviews and rating summaries will appear here once the feedback module is connected to the API.
        </p>
      </section>
    </div>
  );
};

const InfoBlock = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-background/80 p-4 shadow-md shadow-primary/10 dark:bg-card/80 dark:shadow-[0_20px_52px_-28px_rgba(2,6,23,0.8)] dark:ring-1 dark:ring-primary/20">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

const EmptyClinics = () => (
  <div className="rounded-2xl bg-muted/30 p-6 text-sm text-muted-foreground shadow-[0_12px_36px_-24px_rgba(15,23,42,0.45)] dark:bg-background/80 dark:text-muted-foreground/90 dark:shadow-[0_24px_58px_-28px_rgba(2,6,23,0.8)] dark:ring-1 dark:ring-primary/20">
    Clinic addresses will appear here once the doctor publishes availability from the illajwala Doctor Hub.
  </div>
);

