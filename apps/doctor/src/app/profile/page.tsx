"use client";

import { useMemo } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@illajwala/ui";
import { toast } from "sonner";
import { Loader2, Save, Undo2 } from "lucide-react";
import { doctorProfileApi } from "../../lib/api/doctors";
import { useDoctorAuth, useDoctorAuthStore } from "../../hooks/use-auth";

const consultationModeOptions = ["clinic", "telehealth", "home-visit"] as const;

const profileSchema = z.object({
  about: z.string().max(2000).optional(),
  languages: z.string().optional(),
  consultationModes: z
    .array(z.enum(consultationModeOptions))
    .min(1, "Select at least one consultation mode"),
  fee: z.union([z.number().nonnegative(), z.nan()]).optional(),
  experienceYears: z.union([z.number().int().nonnegative(), z.nan()]).optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  clinicCity: z.string().optional(),
  profileImageUrl: z.string().url().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const formatLanguages = (languages?: string[]) => languages?.join(", ") ?? "";

const normalizeCommaList = (value: string | undefined) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export default function DoctorProfilePage() {
  const { doctor, hydrated } = useDoctorAuth();

  const defaultValues = useMemo<ProfileFormValues>(() => {
    const primaryClinic = doctor?.clinicLocations?.[0];
    return {
      about: doctor?.about ?? "",
      languages: formatLanguages(doctor?.languages),
      consultationModes: doctor?.consultationModes ?? ["clinic"],
      fee: doctor?.fee ?? undefined,
      experienceYears: doctor?.experienceYears ?? undefined,
      clinicName: primaryClinic?.name ?? "",
      clinicAddress: primaryClinic?.address ?? "",
      clinicCity: primaryClinic?.city ?? "",
      profileImageUrl: doctor?.profileImageUrl ?? "",
    };
  }, [doctor]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const handleToggleMode = (mode: (typeof consultationModeOptions)[number]) => {
    const current = form.getValues("consultationModes") ?? [];
    if (current.includes(mode)) {
      form.setValue(
        "consultationModes",
        current.filter((item) => item !== mode)
      );
    } else {
      form.setValue("consultationModes", [...current, mode]);
    }
  };

  const handleReset = () => {
    form.reset(defaultValues);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const languagesList = normalizeCommaList(values.languages);
      const normalizedFee =
        typeof values.fee === "number" && Number.isFinite(values.fee) ? values.fee : undefined;
      const normalizedExperience =
        typeof values.experienceYears === "number" && Number.isFinite(values.experienceYears)
          ? values.experienceYears
          : undefined;
      const clinicName = values.clinicName?.trim() ?? "";
      const clinicAddress = values.clinicAddress?.trim() ?? "";
      const clinicCity = values.clinicCity?.trim() ?? "";

      const payload = {
        about: values.about?.trim() || undefined,
        languages: languagesList,
        consultationModes: values.consultationModes,
        fee: normalizedFee,
        experienceYears: normalizedExperience,
        clinicLocations:
          clinicName || clinicAddress || clinicCity
            ? [
                {
                  name: clinicName || "Primary Clinic",
                  address: clinicAddress,
                  city: clinicCity,
                },
              ]
            : undefined,
        profileImageUrl: values.profileImageUrl?.trim() || undefined,
      };

      const updatedDoctor = await doctorProfileApi.updateProfile(payload);

      useDoctorAuthStore.setState((state) => ({
        ...state,
        doctor: updatedDoctor,
      }));

      toast.success("Profile updated", {
        description: "Your clinic details are now up-to-date.",
      });
    } catch (error) {
      console.error("[doctor] Failed to update profile", error);
      toast.error("Unable to save profile", {
        description: "Please review the fields and try again.",
      });
    }
  });

  if (!hydrated) {
    return (
      <main className="bg-muted/20 px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading profile...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-6 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
              <div className="h-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!doctor) {
    return (
      <main className="bg-muted/20 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          We could not load your profile. Please sign in again.
        </div>
      </main>
    );
  }

  const selectedModes = form.watch("consultationModes") ?? [];

  return (
    <main className="bg-muted/20 px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-primary">
              Profile settings
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">Doctor profile</h1>
            <p className="text-sm text-muted-foreground">
              Keep your clinic details current so patients and the admin team stay aligned.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Professional details</CardTitle>
            <CardDescription>
              Update your clinic bio, consultation modes, and onboarding checklist so the platform team can activate you faster.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">About</label>
                <Textarea
                  rows={5}
                  placeholder="Share your experience, areas of focus, and what makes your clinic unique."
                  {...form.register("about")}
                />
                <p className="text-xs text-muted-foreground">2000 characters max.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Languages</label>
                  <Input
                    placeholder="English, Hindi, Tamil"
                    {...form.register("languages")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use commas to separate languages (e.g. English, Hindi, Tamil).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Profile image URL</label>
                  <Input placeholder="https://..." {...form.register("profileImageUrl")} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Consultation modes</p>
                <div className="flex flex-wrap gap-3">
                  {consultationModeOptions.map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => handleToggleMode(mode)}
                      className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] transition ${
                        selectedModes.includes(mode)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {form.formState.errors.consultationModes ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.consultationModes.message as string}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Consultation fee (₹)</label>
                  <Input type="number" step="100" min="0" {...form.register("fee", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Experience (years)</label>
                  <Input
                    type="number"
                    min="0"
                    {...form.register("experienceYears", { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Primary clinic
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input placeholder="Clinic name" {...form.register("clinicName")} />
                  <Input placeholder="Clinic address" {...form.register("clinicAddress")} />
                  <Input placeholder="City" {...form.register("clinicCity")} />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" className="gap-2" onClick={handleReset}>
                  <Undo2 className="h-4 w-4" />
                  Reset
                </Button>
                <Button type="submit" className="gap-2" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}


