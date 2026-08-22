import type { Metadata } from "next";

import { LegalPage } from "@/components/landing/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Head-Hunters",
  description:
    "How Head-Hunters collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="August 2026"
      intro={
        <p>
          This policy explains what information Head-Hunters.com collects, how
          we use it, and the choices you have. It applies to companies,
          recruiters, and candidates whose information is submitted through the
          Platform.
        </p>
      }
      sections={[
        {
          heading: "1. Information we collect",
          body: (
            <p>
              Account details (name, business email, phone, company or recruiter
              profile), verification information you provide, job and candidate
              submissions, and usage data. Payment details are handled by our
              payment providers, not stored by us.
            </p>
          ),
        },
        {
          heading: "2. How we use it",
          body: (
            <p>
              To operate the marketplace — matching roles and recruiters,
              verifying recruiters, processing fees and payouts, providing
              support, and improving the Platform. We do not sell your personal
              information.
            </p>
          ),
        },
        {
          heading: "3. Sharing",
          body: (
            <p>
              Information is shared only as needed to run the marketplace — for
              example, a candidate’s submission is shared with the hiring
              company — and with service providers (payments, email/SMS,
              hosting) under appropriate safeguards, or where required by law.
            </p>
          ),
        },
        {
          heading: "4. Security and retention",
          body: (
            <p>
              We use reasonable technical and organizational measures to protect
              your information and retain it only as long as needed for the
              purposes above or as required by law.
            </p>
          ),
        },
        {
          heading: "5. Your choices",
          body: (
            <p>
              You may access or update your profile in-app, and request deletion
              of your account. Contact us for any privacy request; we respond in
              line with applicable law.
            </p>
          ),
        },
      ]}
    />
  );
}
