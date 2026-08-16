import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { PublicShell } from "@/components/landing/PublicShell";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { Testimonial } from "@/components/landing/Testimonial";

/**
 * The public marketing home, rebuilt to the client reference: hero with the
 * illustrative USA map, live marketplace stats, the four-step How It Works
 * band, pricing (free for recruiters during phases 1–2), and the
 * testimonial.
 */
export default function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <Pricing />
      <Testimonial />
    </PublicShell>
  );
}
