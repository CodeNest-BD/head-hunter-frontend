import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/landing/PlaceholderPage";

export const metadata: Metadata = {
  title: "About — Head-Hunters",
};

export default function AboutPage() {
  return <PlaceholderPage title="About" />;
}
