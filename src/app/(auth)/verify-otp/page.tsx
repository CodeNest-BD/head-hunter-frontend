import { redirect } from "next/navigation";
import { z } from "zod";
import { OtpForm } from "@/features/auth/components/OtpForm";

const emailParamSchema = z.string().email();

interface VerifyOtpPageProps {
  searchParams: { email?: string };
}

export default function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  // The email identifies which pending account to verify; a missing or
  // malformed value has nothing to confirm, so send the user back to sign up.
  const parsed = emailParamSchema.safeParse(searchParams.email);
  if (!parsed.success) redirect("/signup");
  return <OtpForm email={parsed.data} />;
}
