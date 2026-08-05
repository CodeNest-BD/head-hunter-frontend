import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/components/Providers";

// One system-sans for the whole app (headings + body), matching the mock;
// weight/tracking do the display work. Powers `font-sans`/`font-heading`.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} bg-background text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
