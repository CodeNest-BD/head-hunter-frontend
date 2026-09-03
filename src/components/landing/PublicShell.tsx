import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

/**
 * Chrome for every public (no-session) page: the marketing nav on top, the
 * shared footer below. Pages render inside `main`.
 */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
