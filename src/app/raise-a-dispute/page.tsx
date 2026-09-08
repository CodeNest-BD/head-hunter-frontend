import { redirect } from "next/navigation";

/**
 * Raising a dispute is part of the support page now, not a page of its own.
 * The route is kept as a redirect rather than deleted: it was linked from the
 * Resources menu, so a link already shared should land somewhere useful.
 */
export default function RaiseADisputePage() {
  redirect("/contact-support");
}
