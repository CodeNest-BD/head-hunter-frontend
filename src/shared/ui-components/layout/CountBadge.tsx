/**
 * Canonical unread-count pill used by nav items across the sidebar and the
 * user menu. Renders nothing for a falsy count (`undefined` while loading,
 * or `0`) and caps the displayed number at "99+".
 */
export function CountBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
