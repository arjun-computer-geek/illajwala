'use client';

import { HeroSection } from '../components/home/hero-section';
import { MetricsSection } from '../components/home/metrics-section';
import { FocusTracksSection } from '../components/home/focus-tracks-section';
import { ControlMomentsSection } from '../components/home/control-moments-section';
import { AssuranceSection } from '../components/home/assurance-section';

export default function AdminHome() {
  return (
    <main className="bg-background text-foreground">
      <HeroSection />
      <MetricsSection />
      <FocusTracksSection />
      <ControlMomentsSection />
      <AssuranceSection />
    </main>
  );
}
