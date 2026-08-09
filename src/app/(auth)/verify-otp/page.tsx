import { redirect } from "next/navigation";
import { z } from "zod";
import { OtpForm } from "@/features/auth";

const emailParamSchema = z.string().email();

interface VerifyOtpPageProps {
  searchParams: { email?: string; resend?: string };
}

export default function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  // The email identifies which pending account to verify; a missing or
  // malformed value has nothing to confirm, so send the user back to sign up.
  const parsed = emailParamSchema.safeParse(searchParams.email);
  if (!parsed.success) redirect("/signup");
  // `resend=1` is set when arriving from a blocked sign-in, so a fresh code is
  // sent on arrival rather than making the user click "Resend".
  return (
    <OtpForm email={parsed.data} autoResend={searchParams.resend === "1"} />
  );
}
