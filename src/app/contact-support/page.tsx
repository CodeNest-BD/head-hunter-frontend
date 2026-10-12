import type { Metadata } from "next";

import { ContactSupportPage } from "@/components/landing/ContactSupportPage";

export const metadata: Metadata = {
  title: "Contact Support — Head-Hunters",
};

export default function ContactSupport() {
  return <ContactSupportPage />;
}
