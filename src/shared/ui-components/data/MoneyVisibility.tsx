"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";

import { formatMinor } from "@/shared/utils/money";

const STORAGE_KEY = "hh.money.hidden";
/** What a masked amount reads as. Fixed width, so revealing does not reflow. */
const MASK = "••••••";

interface MoneyVisibility {
  readonly hidden: boolean;
  readonly toggle: () => void;
}

const MoneyVisibilityContext = createContext<MoneyVisibility>({
  hidden: true,
  toggle: () => undefined,
});

/**
 * Whether money is masked, for the whole app at once.
 *
 * Hidden is the default: balances, earnings and salaries are the figures people
 * least want on screen while sharing one, and a default of "shown" means the
 * damage is already done by the time they reach for the toggle. The choice is
 * remembered per browser — it is a viewing preference, not account state, so it
 * never goes to the server.
 *
 * Every read is guarded: a private window, cleared site data, or a browser set
 * to block storage makes `localStorage` throw rather than return empty, and
 * money must still render.
 */
export function MoneyVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true);

  // Read after mount, not during render: the server has no localStorage, and
  // reading during render would hydrate a different tree than the server sent.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "false") {
        setHidden(false);
      }
    } catch {
      // No stored preference available — the hidden default stands.
    }
  }, []);

  const toggle = useCallback(() => {
    setHidden((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Preference just does not persist; the toggle still works this session.
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);

  return (
    <MoneyVisibilityContext.Provider value={value}>
      {children}
    </MoneyVisibilityContext.Provider>
  );
}

export function useMoneyVisibility(): MoneyVisibility {
  return useContext(MoneyVisibilityContext);
}

/**
 * A masking formatter, for the places an amount is built into a sentence rather
 * than rendered as its own element — a badge phrase, an aria-label, a toast.
 * Prefer `<Money>` wherever the amount stands alone.
 */
export function useFormatMoney(): (minor: number | null | undefined) => string {
  const { hidden } = useMoneyVisibility();
  return useCallback(
    (minor) => {
      if (minor === null || minor === undefined) return "—";
      return hidden ? MASK : formatMinor(minor);
    },
    [hidden],
  );
}

/**
 * One monetary amount, masked unless the viewer has revealed money.
 *
 * Takes minor units and formats them itself, so no caller can accidentally
 * render a raw amount that the mask then fails to cover.
 */
export function Money({
  minor,
  className,
}: {
  minor: number | null | undefined;
  className?: string;
}) {
  const { hidden } = useMoneyVisibility();
  // An absent amount is "—" either way: there is nothing to conceal, and
  // masking it would imply a value exists.
  if (minor === null || minor === undefined) {
    return <span className={className}>—</span>;
  }
  return (
    <span className={className}>
      {hidden ? (
        <span aria-label="Amount hidden">{MASK}</span>
      ) : (
        formatMinor(minor)
      )}
    </span>
  );
}

/**
 * The show/hide control. Rendered once in the top bar — the mask is global, so
 * one switch covers every amount rather than a button beside each figure.
 */
export function MoneyVisibilityToggle({ className }: { className?: string }) {
  const { hidden, toggle } = useMoneyVisibility();
  const Icon = hidden ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={toggle}
      title={hidden ? "Show amounts" : "Hide amounts"}
      aria-pressed={!hidden}
      aria-label={hidden ? "Show amounts" : "Hide amounts"}
      className={
        className ??
        "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      }
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
