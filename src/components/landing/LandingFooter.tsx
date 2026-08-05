/**
 * Marketing footer copied from the v2 mock: copyright left, a short link list
 * right, above a hairline border.
 */
export function LandingFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t border-[#E7EAF0] px-5 py-6 text-[13px] text-[#8A93A3] sm:flex-row sm:items-center sm:justify-between md:px-11">
      <span>© 2026 HeadHunter.com</span>
      <nav aria-label="Footer">
        <ul className="flex gap-2">
          <li>Terms</li>
          <li aria-hidden="true">·</li>
          <li>Privacy</li>
          <li aria-hidden="true">·</li>
          <li>Support</li>
        </ul>
      </nav>
    </footer>
  );
}
