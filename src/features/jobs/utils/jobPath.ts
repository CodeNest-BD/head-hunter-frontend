const UUID_AT_END =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Long enough to carry a real title, short enough that the id stays visible
// when the URL is shared.
const MAX_SLUG_LENGTH = 60;

/** "Senior Software Engineer (Remote)" -> "senior-software-engineer-remote". */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-+|-+$/g, "");
}

/**
 * The job detail URL: `/jobs/<title-slug>-<uuid>`. The slug is decorative —
 * the id at the end is what the page looks the job up by — so a renamed job
 * or an old bare-uuid link still resolves, and the page redirects it to this
 * canonical form.
 */
export function jobPath(job: { id: string; title?: string | null }): string {
  const slug = slugify(job.title ?? "");
  return slug ? `/jobs/${slug}-${job.id}` : `/jobs/${job.id}`;
}

/** The job id out of a `/jobs/[slug]` segment; a bare uuid passes through. */
export function jobIdFromSlug(segment: string): string {
  return segment.match(UUID_AT_END)?.[0] ?? segment;
}
