import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCandidate,
  deleteCandidate,
  fetchAttachments,
  fetchCandidates,
  presignSubmissionUpload,
  updateCandidate,
  updateCandidateStatus,
  uploadToPresignedUrl,
  type CandidateInput,
} from "../api/candidates";
import { candidateKeys } from "../keys";
import type { CandidateStatus } from "../schemas";

export function useCandidates(submissionId: string) {
  return useQuery({
    queryKey: candidateKeys.forSubmission(submissionId),
    queryFn: () => fetchCandidates(submissionId),
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

export function useUpdateCandidateStatus(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CandidateStatus }) =>
      updateCandidateStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateKeys.forSubmission(submissionId),
      });
      toast.success("Candidate updated");
    },
  });
}

export function useSubmitCandidate(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      cvFile,
    }: {
      input: CandidateInput;
      cvFile: File;
    }) => {
      const staged = await presignSubmissionUpload(submissionId, cvFile);
      await uploadToPresignedUrl(staged.uploadUrl, cvFile);
      return createCandidate(submissionId, input, [
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
        queryKey: candidateKeys.forSubmission(submissionId),
      });
      toast.success("Candidate submitted");
    },
  });
}

export function useUpdateCandidate(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<CandidateInput>;
    }) => updateCandidate(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateKeys.forSubmission(submissionId),
      });
      toast.success("Candidate updated");
    },
  });
}

export function useDeleteCandidate(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCandidate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: candidateKeys.forSubmission(submissionId),
      });
      toast.success("Candidate removed");
    },
  });
}
