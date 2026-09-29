import { z } from "zod";

/**
 * An entity's per-table number, used in URLs in place of its UUID. The UUID
 * stays the identity everywhere else — mutations, cache keys, realtime
 * payloads — so a serial is never read back out of a URL past the page's one
 * read.
 */
export const serialNumberSchema = z.number().int().positive();

/**
 * What a URL is built from. `serialNumber` is optional because rows written
 * before serials existed (old notifications) or served by an older backend
 * carry only the UUID, which every page still accepts.
 */
export interface EntityRef {
  id: string;
  serialNumber?: number;
}

type InboxSide = "company" | "recruiter";

const UUID_AT_END =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const urlRef = ({ id, serialNumber }: EntityRef): string =>
  String(serialNumber ?? id);

export const jobPath = (job: EntityRef): string => `/jobs/${urlRef(job)}`;

export const companyJobPath = (job: EntityRef): string =>
  `/company/jobs/${urlRef(job)}`;

export const adminJobEditPath = (job: EntityRef): string =>
  `/admin/jobs/${urlRef(job)}/edit`;

export const inboxJobPath = (side: InboxSide, job: EntityRef): string =>
  `/${side}/inbox/job/${urlRef(job)}`;

export const submitCandidatePath = (job: EntityRef): string =>
  `${inboxJobPath("recruiter", job)}/submit`;

export const inboxThreadPath = (
  side: InboxSide,
  candidate: EntityRef,
): string => `/${side}/inbox/${urlRef(candidate)}`;

export const adminConversationPath = (candidate: EntityRef): string =>
  `/admin/conversations/${urlRef(candidate)}`;

export const disputePath = (dispute: EntityRef): string =>
  `/disputes/${urlRef(dispute)}`;

export const adminDisputePath = (dispute: EntityRef): string =>
  `/admin/disputes/${urlRef(dispute)}`;

/** `id` is the account's user id: the admin routes' UUID form predates serials. */
export const adminRecruiterPath = (recruiter: EntityRef): string =>
  `/admin/recruiters/${urlRef(recruiter)}`;

/** `id` is the account's user id: the admin routes' UUID form predates serials. */
export const adminCompanyPath = (company: EntityRef): string =>
  `/admin/companies/${urlRef(company)}`;

/**
 * The read ref out of a `/jobs/[id]` segment. Job links used to be
 * `/jobs/<title-slug>-<uuid>`, so a shared old link still resolves by the UUID
 * at its end; a serial or a bare UUID passes through.
 */
export const jobRefFromSegment = (segment: string): string =>
  segment.match(UUID_AT_END)?.[0] ?? segment;
