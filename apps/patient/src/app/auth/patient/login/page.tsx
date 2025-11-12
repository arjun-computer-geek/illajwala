import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { PatientLoginForm } from "@/components/auth/patient-login-form";

export const metadata: Metadata = {
  title: "Patient sign in",
  description: "Access your illajwala account to manage appointments and medical history.",
};

export default function PatientLoginPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <AuthCard
        title="Welcome back"
        description="Sign in to reschedule appointments, join telehealth visits, and view your medical records."
        footer={
          <>
            New to illajwala?{" "}
            <Link href="/auth/patient/register" className="font-medium text-primary">
              Create an account
            </Link>
          </>
        }
      >
        <PatientLoginForm />
      </AuthCard>
    </div>
  );
}

