/**
 * The reference's `.rail__badge`: the unread-count pill used by nav items across
 * the sidebar and the
 * user menu. Renders nothing for a falsy count (`undefined` while loading,
 * or `0`) and caps the displayed number at "99+".
 */
export function CountBadge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-blue px-1.5 text-[10.5px] font-bold tabular-nums leading-[18px] text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
