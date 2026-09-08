import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/LegalPage";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "./content";

export const metadata: Metadata = {
  title: "Privacy Policy — Head-Hunters",
  description:
    "How Head-Hunters.com collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={PRIVACY_UPDATED}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
