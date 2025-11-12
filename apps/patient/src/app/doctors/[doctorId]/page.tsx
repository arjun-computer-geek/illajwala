import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DoctorProfile } from "@/components/doctor/doctor-profile";
import type { Doctor } from "@/types/api";

type PageProps = {
  params: Promise<{ doctorId: string }>;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

async function getDoctor(doctorId: string): Promise<Doctor | null> {
  try {
    const response = await fetch(`${API_BASE}/doctors/${doctorId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data?.data ?? null;
  } catch (error) {
    console.error("Failed to fetch doctor", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { doctorId } = await params;
  const doctor = await getDoctor(doctorId);

  if (!doctor) {
    return {
      title: "Doctor not found",
    };
  }

  return {
    title: `${doctor.name} | ${doctor.specialization}`,
    description: doctor.about,
  };
}

export default async function DoctorPage({ params }: PageProps) {
  const { doctorId } = await params;
  const doctor = await getDoctor(doctorId);

  if (!doctor) {
    notFound();
  }

  return (
    <div className="container py-10">
      <DoctorProfile doctor={doctor} />
    </div>
  );
}

