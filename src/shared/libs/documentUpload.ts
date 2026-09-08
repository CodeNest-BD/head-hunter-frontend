import axios from "axios";

/**
 * The document rules every upload surface shares — a candidate's CV and a
 * job's benefits summary alike. Here rather than in either feature so the two
 * cannot drift into accepting different files.
 */
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx";

export const DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/** The API's own ceiling is 25 MB; 10 MB is what these forms ask of a user. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const MAX_DOCUMENT_MB = Math.floor(MAX_DOCUMENT_BYTES / (1024 * 1024));

/** What a presign call hands back: where to PUT, and the key to record. */
export interface StagedUpload {
  s3Key: string;
  uploadUrl: string;
}

/** Raw PUT to S3 — no auth header, so plain axios, not apiClient. */
export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
}
