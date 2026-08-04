export const candidateKeys = {
  all: ["candidates"] as const,
  forSubmission: (submissionId: string) =>
    ["candidates", "submission", submissionId] as const,
  attachments: (candidateId: string) =>
    ["candidates", "attachments", candidateId] as const,
};
