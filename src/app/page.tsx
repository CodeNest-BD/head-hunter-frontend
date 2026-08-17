import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PublicShell } from "@/components/landing/PublicShell";
import { Testimonial } from "@/components/landing/Testimonial";

/**
 * The public marketing home, per the client reference: hero with the
 * illustrative USA map and the live marketplace stats directly beneath it,
 * the four-step How It Works band, and the testimonial. (The pricing section
 * was dropped per client feedback.)
 */
export default function HomePage() {
  return (
    <PublicShell>
      <Hero />
      <HowItWorks />
      <Testimonial />
    </PublicShell>
  );
}
