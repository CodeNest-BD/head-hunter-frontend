import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

/**
 * Chrome for every public (no-session) page: the marketing nav on top, the
 * shared footer below. Pages render inside `main`.
 */
export function PublicShell({
  children,
  fluid = false,
}: {
  children: React.ReactNode;
  /** Full-width chrome for tool pages (e.g. explore-jobs) vs. the 1240px
   * marketing width used by the landing page. */
  fluid?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <LandingNav fluid={fluid} />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
