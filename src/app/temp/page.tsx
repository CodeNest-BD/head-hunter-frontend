import Link from "next/link";
import { Logo } from "@/shared/ui-components/layout/Logo";

// Previous landing page, moved here while `/` shows the "under development"
// placeholder. Reachable at /temp.
export default function TempLandingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-background px-6 text-center">
      <div className="pointer-events-none absolute -top-40 right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex flex-col items-center gap-4">
        <Logo />
        <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground">
          HeadHunter
        </h1>
        <p className="max-w-md text-muted-foreground">
          The recruitment marketplace connecting companies with specialist
          recruiters.
        </p>
      </div>
      <div className="relative flex gap-3">
        <Link
          href="/login"
          className="h-11 rounded-md border border-border bg-card px-6 text-sm font-medium leading-[2.75rem] text-foreground transition-colors hover:border-primary/50 hover:bg-accent"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="h-11 rounded-md bg-primary px-6 text-sm font-medium leading-[2.75rem] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
