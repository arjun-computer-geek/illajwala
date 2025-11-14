'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Skeleton,
} from '@illajwala/ui';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminClinicsApi } from '@/lib/api/clinics';
import { adminQueryKeys } from '@/lib/query-keys';

type ClinicMetrics = {
  clinicId: string;
  clinicName: string;
  activeDoctors: number;
  appointmentsToday: number;
  revenueToday: number;
  status: 'active' | 'pending' | 'suspended';
};

// Mock data - replace with real API call
const mockClinicMetrics: ClinicMetrics[] = [
  {
    clinicId: '1',
    clinicName: 'Skin Renewal Clinic',
    activeDoctors: 8,
    appointmentsToday: 24,
    revenueToday: 48000,
    status: 'active',
  },
  {
    clinicId: '2',
    clinicName: 'Mumbai Dermatology',
    activeDoctors: 12,
    appointmentsToday: 42,
    revenueToday: 84000,
    status: 'active',
  },
  {
    clinicId: '3',
    clinicName: 'Delhi Wellness Center',
    activeDoctors: 5,
    appointmentsToday: 18,
    revenueToday: 36000,
    status: 'active',
  },
  {
    clinicId: '4',
    clinicName: 'Bangalore Health Hub',
    activeDoctors: 0,
    appointmentsToday: 0,
    revenueToday: 0,
    status: 'pending',
  },
];

export const MultiClinicView = () => {
  const [selectedClinic, setSelectedClinic] = useState<string>('all');

  const { data: clinics, isLoading: clinicsLoading } = useQuery({
    queryKey: adminQueryKeys.clinics(),
    queryFn: () => adminClinicsApi.list({ pageSize: 100 }),
    staleTime: 5 * 60_000,
  });

  // TODO: Replace with real API call
  const { data: clinicMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: [...adminQueryKeys.clinics(), 'metrics'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockClinicMetrics;
    },
    staleTime: 2 * 60_000,
  });

  const filteredMetrics = useMemo(() => {
    if (!clinicMetrics) return [];
    if (selectedClinic === 'all') return clinicMetrics;
    return clinicMetrics.filter((m) => m.clinicId === selectedClinic);
  }, [clinicMetrics, selectedClinic]);

  const totalMetrics = useMemo(() => {
    return filteredMetrics.reduce(
      (acc, clinic) => ({
        activeDoctors: acc.activeDoctors + clinic.activeDoctors,
        appointmentsToday: acc.appointmentsToday + clinic.appointmentsToday,
        revenueToday: acc.revenueToday + clinic.revenueToday,
      }),
      { activeDoctors: 0, appointmentsToday: 0, revenueToday: 0 },
    );
  }, [filteredMetrics]);

  const statusVariant = (status: ClinicMetrics['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'suspended':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    }
  };

  if (clinicsLoading || metricsLoading) {
    return (
      <Card className="rounded-lg border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Multi-clinic overview
          </CardTitle>
          <CardDescription>Monitor performance across all clinics.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg border border-border bg-card shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Multi-clinic overview
            </CardTitle>
            <CardDescription>Monitor performance across all clinics.</CardDescription>
          </div>
          <Select value={selectedClinic} onValueChange={setSelectedClinic}>
            <SelectTrigger className="w-[200px] rounded-full">
              <SelectValue placeholder="Select clinic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clinics</SelectItem>
              {clinics?.data.map((clinic) => (
                <SelectItem key={clinic._id} value={clinic._id}>
                  {clinic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedClinic === 'all' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Total doctors
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">{totalMetrics.activeDoctors}</p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Appointments today
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {totalMetrics.appointmentsToday}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Revenue today
                </span>
              </div>
              <p className="text-2xl font-semibold text-foreground">
                ₹{totalMetrics.revenueToday.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredMetrics.map((clinic) => (
            <div
              key={clinic.clinicId}
              className={`rounded-lg border p-4 ${statusVariant(clinic.status)}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{clinic.clinicName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-0.5 text-[10px] ${statusVariant(clinic.status)}`}
                      >
                        {clinic.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {clinic.activeDoctors} doctors
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Appointments: </span>
                    <span className="font-semibold text-foreground">
                      {clinic.appointmentsToday}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revenue: </span>
                    <span className="font-semibold text-foreground">
                      ₹{clinic.revenueToday.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
