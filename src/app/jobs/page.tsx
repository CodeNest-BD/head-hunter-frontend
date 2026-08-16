import { redirect } from "next/navigation";

/**
 * The old recruiter-only job map lived here. Browsing now happens on the
 * public explore page (where verified recruiters still get the live map), so
 * this route only forwards. Job details remain at /jobs/[id].
 */
export default function JobsPage() {
  redirect("/explore-jobs");
}
