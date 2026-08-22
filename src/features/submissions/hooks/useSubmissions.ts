import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import {
  createSubmission,
  fetchInboxJobs,
  fetchInboxRecruiters,
  fetchSubmission,
  fetchSubmissions,
  updateSubmissionStatus,
  type InboxJobsParams,
  type InboxRecruitersParams,
  type SubmissionListParams,
} from "../api/submissions";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { submissionKeys } from "../keys";
import type { SettableSubmissionStatus } from "../schemas";

export function useSubmissions(params: SubmissionListParams) {
  return useQuery({
    queryKey: submissionKeys.list(params),
    queryFn: () => fetchSubmissions(params),
    // Keep the current page visible while the next page/filter loads.
    placeholderData: keepPreviousData,
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionKeys.detail(id),
    queryFn: () => fetchSubmission(id),
    // The counterparty moves the submission's status; the list already polls,
    // and an open detail page should not be staler than the list behind it.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useUpdateSubmissionStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: SettableSubmissionStatus) =>
      updateSubmissionStatus(id, status),
    onSuccess: (submission) => {
      queryClient.setQueryData(submissionKeys.detail(id), submission);
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      toast.success("Submission updated");
    },
  });
}

/**
 * Submitting to a job the recruiter has already submitted to returns a 409;
 * that is not an error from the caller's perspective, so this resolves to
 * the pre-existing submission instead of throwing.
 */
export function useCreateOrOpenSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jobId, note }: { jobId: string; note?: string }) => {
      try {
        return await createSubmission(jobId, note);
      } catch (error) {
        if (isApiError(error) && error.statusCode === 409) {
          const existing = await fetchSubmissions({ jobId, page: 1 });
          const submission = existing.data[0];
          if (submission) return submission;
        }
        throw error;
      }
    },
    onSuccess: (submission) => {
      void queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.setQueryData(
        submissionKeys.detail(submission.id),
        submission,
      );
    },
    onError: (error) => {
      toast.error(
        isApiError(error)
          ? error.message
          : "Could not submit candidates for this job. Please try again.",
      );
    },
  });
}

export function useInboxJobs(params: InboxJobsParams) {
  return useQuery({
    queryKey: submissionKeys.inboxJobs(params),
    queryFn: () => fetchInboxJobs(params),
    placeholderData: keepPreviousData,
    // Carries the per-job new-candidate and unread counts.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useInboxRecruiters(
  jobId: string,
  params: InboxRecruitersParams,
) {
  return useQuery({
    queryKey: submissionKeys.inboxRecruiters(jobId, params),
    queryFn: () => fetchInboxRecruiters(jobId, params),
    placeholderData: keepPreviousData,
    // Carries the per-recruiter unread and candidate counts.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}
