import { Button } from "./button";

export interface ConfirmActionProps {
  /** Why this is destructive/irreversible, shown as the panel's copy. */
  message: string;
  /** Label on the confirm button while idle, e.g. "Confirm remove". */
  confirmLabel: string;
  /** Label on the confirm button while busy, e.g. "Removing…". Defaults to
   * `${confirmLabel}…`. */
  busyLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

/**
 * Inline two-step confirmation for a destructive, irreversible action — the
 * one panel every "Remove"/"Withdraw" flow in the app renders instead of
 * hand-rolling its own destructive-tinted box.
 */
export function ConfirmAction({
  message,
  confirmLabel,
  busyLabel,
  onConfirm,
  onCancel,
  busy = false,
}: ConfirmActionProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-destructive">{message}</p>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? (busyLabel ?? `${confirmLabel}…`) : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
