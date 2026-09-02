/**
 * A money-bag icon in the lucide house style (24×24, stroke `currentColor`), so
 * it inherits size and colour from Tailwind classes like a lucide icon does —
 * lucide has no money-bag glyph of its own. Used for the recruiter fee.
 */
export function MoneyBag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Cinched neck: the folded top of the sack. */}
      <path d="M9 3l-1.2 3.2M15 3l1.2 3.2" />
      <path d="M7.5 6.2h9" />
      {/* Bag body. */}
      <path d="M8.2 6.2C5.9 8 4.5 10.8 4.5 14a7.5 6.5 0 0 0 15 0c0-3.2-1.4-6-3.7-7.8" />
      {/* Dollar sign. */}
      <path d="M12 9.3v7.4" />
      <path d="M14 11a2.1 2.1 0 0 0-2-1.2c-1.1 0-2 .6-2 1.5s.9 1.3 2 1.5 2 .6 2 1.5-.9 1.5-2 1.5a2.2 2.2 0 0 1-2-1" />
    </svg>
  );
}
