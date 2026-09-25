import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { isApiError } from "@/shared/libs/errorHandler";
import {
  createCandidate,
  deleteCandidate,
  fetchAttachments,
  fetchCandidate,
  fetchMyCandidatesForJob,
  presignCandidateUpload,
  updateCandidate,
  uploadToPresignedUrl,
  type CandidateInput,
} from "../api/candidates";
import { REALTIME_POLL_MS } from "@/shared/libs/polling";
import { conversationKeys } from "@/features/conversations/keys";
import { inboxKeys } from "@/features/inbox/keys";
import { candidateKeys } from "../keys";

/** The calling recruiter's own candidates on one job — at most five. */
export function useMyCandidatesForJob(jobId: string) {
  return useQuery({
    queryKey: candidateKeys.forJob(jobId),
    queryFn: () => fetchMyCandidatesForJob(jobId),
    // The company moves a candidate's status, so the recruiter's copy has to
    // learn about a change it did not make.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/** One candidate — the subject of a conversation, and its detail pane. */
export function useCandidate(candidateId: string) {
  return useQuery({
    queryKey: candidateKeys.detail(candidateId),
    queryFn: () => fetchCandidate(candidateId),
    // The company moves the status, so the recruiter's copy has to learn about
    // a change it did not make.
    refetchInterval: REALTIME_POLL_MS,
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetched per candidate and only when the row is expanded: every call mints
 * fresh presigned URLs, so there is no point requesting links nobody opens.
 */
export function useAttachments(candidateId: string, enabled: boolean) {
  return useQuery({
    queryKey: candidateKeys.attachments(candidateId),
    queryFn: () => fetchAttachments(candidateId),
    enabled,
  });
}

export function useSubmitCandidate(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      cvFile,
    }: {
      input: CandidateInput;
      cvFile: File;
    }) => {
      const staged = await presignCandidateUpload(jobId, cvFile);
      await uploadToPresignedUrl(staged.uploadUrl, cvFile);
      return createCandidate(jobId, input, [
        {
          s3Key: staged.s3Key,
          fileName: cvFile.name,
          contentType: cvFile.type,
          sizeBytes: cvFile.size,
        },
      ]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateKeys.forJob(jobId),
      });
      toast.success("Candidate submitted");
    },
    onError: (error) => {
      // uploadToPresignedUrl PUTs straight to S3 with plain axios, so a raw
      // AxiosError (as opposed to apiClient's parsed ApiError) means that leg
      // failed rather than the presign or create call.
      if (axios.isAxiosError(error)) {
        toast.error(
          "Could not upload the CV — check your connection and try again",
        );
        return;
      }
      toast.error(
        isApiError(error)
          ? error.message
          : "Could not submit this candidate. Please try again.",
      );
    },
  });
}

export function useUpdateCandidate(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CandidateInput>;
    }) => updateCandidate(id, input),
    // The edit shows in three places: the candidate rail, the thread (its
    // header carries the candidate) and the inbox rows. Refreshing only the
    // job list left the rail and the thread stale until their next poll; the
    // refetch is awaited so the form stays saving until both panes show it.
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: candidateKeys.all }),
        queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
        queryClient.invalidateQueries({ queryKey: inboxKeys.all }),
      ]);
      toast.success("Candidate updated");
    },
  });
}

export function useDeleteCandidate(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateKeys.forJob(jobId),
      });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
      toast.success("Candidate removed");
    },
  });
}
