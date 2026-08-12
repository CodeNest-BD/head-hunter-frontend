import type { InterviewListParams } from "./api/interviews";

export const interviewKeys = {
  all: ["interviews"] as const,
  list: (params: InterviewListParams) =>
    ["interviews", "list", params] as const,
  detail: (id: string) => ["interviews", "detail", id] as const,
};
