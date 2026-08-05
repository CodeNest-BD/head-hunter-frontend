import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Powers the `font-heading` utility (see tailwind.config.ts).
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HeadHunter",
  description:
    "The recruitment marketplace connecting companies and recruiters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
      <body
        className={`${inter.className} bg-background text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
