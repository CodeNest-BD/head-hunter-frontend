import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/LegalPage";
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_UPDATED } from "./content";

export const metadata: Metadata = {
  title: "Terms of Service — Head-Hunters",
  description:
    "The terms that govern use of the Head-Hunters.com recruiting marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={TERMS_UPDATED}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
