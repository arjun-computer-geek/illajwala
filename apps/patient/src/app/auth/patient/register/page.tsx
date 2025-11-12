import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { PatientRegisterForm } from "@/components/auth/patient-register-form";

export const metadata: Metadata = {
  title: "Create patient account",
  description: "Set up your illajwala profile to book visits, manage dependents, and track care journeys.",
};

export default function PatientRegisterPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <AuthCard
        title="Create your account"
        description="Book appointments in minutes, receive live updates, and manage family care from one dashboard."
        footer={
          <>
            Already registered?{" "}
            <Link href="/auth/patient/login" className="font-medium text-primary">
              Sign in
            </Link>
          </>
        }
      >
        <PatientRegisterForm />
      </AuthCard>
    </div>
  );
}

