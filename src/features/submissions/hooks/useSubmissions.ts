import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchSubmission,
  fetchSubmissions,
  updateSubmissionStatus,
  type SubmissionListParams,
} from "../api/submissions";
import { submissionKeys } from "../keys";
import type { SubmissionStatus } from "../schemas";

export function useSubmissions(params: SubmissionListParams) {
  return useQuery({
    queryKey: submissionKeys.list(params),
    queryFn: () => fetchSubmissions(params),
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: () => fetchSubmission(id),
  });
}

export function useUpdateSubmissionStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: SubmissionStatus) =>
      updateSubmissionStatus(id, status),
    onSuccess: (submission) => {
      queryClient.setQueryData(submissionKeys.detail(id), submission);
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      toast.success("Submission updated");
    },
  });
}
