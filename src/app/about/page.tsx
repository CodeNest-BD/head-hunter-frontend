import type { Metadata } from "next";

import { AboutPage } from "@/components/landing/AboutPage";

export const metadata: Metadata = {
  title: "About — Head-Hunters",
  description:
    "Head-Hunters.com is the open marketplace for professional recruiting — a third option between job boards and traditional agencies.",
};

export default function About() {
  return <AboutPage />;
}
