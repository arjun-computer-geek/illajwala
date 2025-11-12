import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doctor } from "@/types/api";

type DoctorCardProps = {
  doctor: Doctor;
  ctaLabel?: string;
  href?: string;
};

export const DoctorCard = ({ doctor, ctaLabel = "Book appointment", href }: DoctorCardProps) => {
  const targetHref = href ?? `/doctors/${doctor._id}`;
  return (
    <Card className="group flex h-full flex-col justify-between border border-border/50 bg-white/80 p-2 shadow-[0_22px_50px_-26px_rgba(32,113,182,0.28)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_26px_56px_-22px_rgba(32,113,182,0.32)] dark:border-border/40 dark:bg-background/80">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-accent/70 shadow-[0_18px_42px_-28px_rgba(32,113,182,0.4)]">
          <Image
            src={doctor.profileImageUrl ?? `https://avatar.vercel.sh/${doctor.name}.png`}
            alt={doctor.name}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <CardTitle className="text-xl font-semibold text-foreground">{doctor.name}</CardTitle>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            {doctor.specialization}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{doctor.rating?.toFixed(1) ?? "4.8"}</span>
          <span className="text-muted-foreground">
            ({doctor.totalReviews ?? 80} reviews)
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{doctor.clinicLocations?.[0]?.name ?? "Multiple clinics"}</span>
        </div>
        {doctor.fee && (
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
            ₹{doctor.fee} consultation
          </Badge>
        )}
        <Link href={targetHref} className="block">
          <Button className="w-full">{ctaLabel}</Button>
        </Link>
      </CardContent>
    </Card>
  );
};

