import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Escrow } from "@/components/landing/Escrow";
import { Pricing } from "@/components/landing/Pricing";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * The real marketing landing — a faithful build of the "HeadHunter Platform v2"
 * mock. Parked at /temp for now while / shows the coming-soon placeholder.
 * Static and auth-free; /temp is whitelisted as public in AuthProvider.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Escrow />
        <Pricing />
      </main>
      <LandingFooter />
    </div>
  );
}
