import type { Metadata } from "next";

import { FaqPage } from "@/components/landing/FaqPage";
import { FAQ_ENTRIES } from "./content";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Head-Hunters",
};

export default function Faq() {
  return <FaqPage entries={FAQ_ENTRIES} />;
}
