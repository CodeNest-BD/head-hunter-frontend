/**
 * Option lists — every dropdown, select and menu in the app.
 *
 * A stack of same-weight rows with nothing between them is hard to scan: the
 * eye has no anchor between one label and the next, and the longer labels in
 * this product ("Resolved — Countdown Resumed", "Placement Wrongly Rejected")
 * run together. A hairline between rows gives each one an edge.
 *
 * Applied to the list container rather than to each row, so it draws only
 * *between* options — no stray rule under the last one, and no `last:` rule to
 * mis-fire when a row is wrapped in something.
 *
 * The container's own `p-1` insets the rules from the panel's border, which
 * keeps them reading as separators rather than as the panel's own edges.
 */
export const MENU_OPTION_LIST = "divide-y divide-line";
