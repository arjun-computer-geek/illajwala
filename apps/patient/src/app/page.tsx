import { HeroSection } from "@/components/sections/hero";
import { StatsSection } from "@/components/sections/stats";
import { FeaturedDoctorsSection } from "@/components/sections/featured-doctors";
import { HowItWorksSection } from "@/components/sections/how-it-works";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturedDoctorsSection />
      <HowItWorksSection />
    </>
  );
}
