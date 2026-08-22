import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Head-Hunters",
  description:
    "The terms that govern use of the Head-Hunters recruiting marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="August 2026"
      intro={
        <p>
          These terms govern your use of Head-Hunters.com (the “Platform”), the
          marketplace that connects companies posting fee-backed roles with
          independent recruiters. By creating an account or using the Platform,
          you agree to these terms.
        </p>
      }
      sections={[
        {
          heading: "1. Accounts",
          body: (
            <p>
              You must provide accurate information at sign-up and keep it
              current. Recruiter accounts require verification before accessing
              the live job map. You are responsible for activity under your
              account and for keeping your credentials secure.
            </p>
          ),
        },
        {
          heading: "2. Fees and payments",
          body: (
            <p>
              Companies set a committed recruiter fee for each job at posting
              and fund it in advance. Recruiter commissions are held in escrow
              and released after the placement’s guarantee period. All payments
              are processed through our third-party payment providers.
            </p>
          ),
        },
        {
          heading: "3. Acceptable use",
          body: (
            <p>
              Do not misrepresent candidates or companies, circumvent the
              Platform to avoid fees, scrape data, or use the Platform for any
              unlawful purpose. We may suspend accounts that violate these
              terms.
            </p>
          ),
        },
        {
          heading: "4. Disclaimers and liability",
          body: (
            <p>
              The Platform is provided “as is.” We are a marketplace and are not
              a party to the employment relationship between a company and any
              candidate. To the extent permitted by law, our liability is
              limited to the fees paid through the Platform.
            </p>
          ),
        },
        {
          heading: "5. Changes",
          body: (
            <p>
              We may update these terms from time to time. Material changes will
              be communicated in-app or by email, and continued use after an
              update constitutes acceptance.
            </p>
          ),
        },
      ]}
    />
  );
}
