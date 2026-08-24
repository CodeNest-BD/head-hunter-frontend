export const candidateKeys = {
  all: ["candidates"] as const,
  forJob: (jobId: string) => ["candidates", "job", jobId] as const,
  detail: (candidateId: string) =>
    ["candidates", "detail", candidateId] as const,
  attachments: (candidateId: string) =>
    ["candidates", "attachments", candidateId] as const,
};
