import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { uploadToPresignedUrl } from "@/shared/libs/documentUpload";
import { isApiError } from "@/shared/libs/errorHandler";
import {
  createJob,
  deleteJob,
  fetchJob,
  fetchJobMap,
  fetchJobs,
  presignBenefitsAttachment,
  updateJob,
  type JobFilterParams,
  type JobListParams,
  type JobWriteInput,
} from "../api/jobs";
import { jobKeys } from "../keys";
import type { Job, JobStatus } from "../schemas";

/** Verbatim from the client feedback round — do not reword. */
const BENEFITS_DOCUMENT_FAILED =
  "Job saved, but the benefits document didn't upload — re-attach it below.";

/** What the job form hands back: the write, plus a file picked for upload. */
interface JobSubmission {
  input: JobWriteInput;
  /** Uploaded only after the job exists; null when nothing was picked. */
  benefitsDocument: File | null;
}

interface SavedJob {
  job: Job;
  /** True when a document was picked and could not be attached. */
  benefitsDocumentFailed: boolean;
}

/**
 * Attaches the document to a job that already exists — its object key is
 * scoped to the job id, so there is nothing to upload against before then.
 * Returns the job as the attaching PATCH left it.
 */
async function attachBenefitsDocument(job: Job, file: File): Promise<Job> {
  const staged = await presignBenefitsAttachment(job.id, file);
  await uploadToPresignedUrl(staged.uploadUrl, file);
  return updateJob(
    job.id,
    {
      // The API replaces `intake` wholesale, so the rest of it has to ride
      // along or this PATCH would erase everything the form just wrote.
      intake: {
        ...(job.intake ?? {}),
        benefitsAttachment: {
          s3Key: staged.s3Key,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        },
      },
    },
    { suppressGlobalErrorToast: true },
  );
}

/**
 * Saves nothing itself — takes a job that was just written and attaches the
 * document to it.
 *
 * A failed upload deliberately keeps the job, unlike create-and-publish which
 * rolls its draft back: the job is the valuable thing and the form is long, so
 * the company is told and left able to re-attach rather than losing the lot.
 */
async function withBenefitsDocument(
  job: Job,
  file: File | null,
): Promise<SavedJob> {
  if (!file) return { job, benefitsDocumentFailed: false };
  try {
    return {
      job: await attachBenefitsDocument(job, file),
      benefitsDocumentFailed: false,
    };
  } catch {
    return { job, benefitsDocumentFailed: true };
  }
}

export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => fetchJobs(params),
    // Keep the current page on screen while the next page/filter loads, so the
    // table doesn't flash a skeleton on every pagination step.
    placeholderData: keepPreviousData,
  });
}

export function useJobMap(params: JobFilterParams) {
  return useQuery({
    queryKey: jobKeys.map(params),
    queryFn: () => fetchJobMap(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJob(id),
  });
}

/** Soft-delete a job the company owns; refreshes the jobs list on success. */
export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Job deleted");
    },
    onError: () => {
      toast.error("Could not delete the job. Please try again.");
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ input, benefitsDocument }: JobSubmission) =>
      withBenefitsDocument(await createJob(input), benefitsDocument),
    onSuccess: ({ job, benefitsDocumentFailed }) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      if (benefitsDocumentFailed) {
        // The edit page is where re-attaching works, against the real job id.
        toast.error(BENEFITS_DOCUMENT_FAILED);
        router.push(`/company/jobs/${job.id}`);
        return;
      }
      toast.success("Draft saved");
      router.push("/company/jobs");
    },
  });
}

/**
 * Create a job and publish it in one action (the "Publish" button on the new-job
 * form). Publishing reserves the fee, so it can fail on insufficient funds.
 * Posting is all-or-nothing: if publishing fails we delete the just-created
 * draft so no half-finished post lingers in the list, surface the error, and
 * stay on the form. Only a successful publish redirects to the list.
 */
export function useCreateAndPublishJob() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async ({ input, benefitsDocument }: JobSubmission) => {
      const draft = await createJob(input, { suppressGlobalErrorToast: true });
      let published: Job;
      try {
        published = await updateJob(
          draft.id,
          { status: "published" },
          { suppressGlobalErrorToast: true },
        );
      } catch (error) {
        // Roll back the draft so a failed post leaves nothing behind.
        await deleteJob(draft.id).catch(() => undefined);
        throw error;
      }
      // Attached only after the post has succeeded, so a failed upload — which
      // is survivable by design — can never reach the rollback above.
      return withBenefitsDocument(published, benefitsDocument);
    },
    onSuccess: ({ job, benefitsDocumentFailed }) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      if (benefitsDocumentFailed) {
        toast.error(BENEFITS_DOCUMENT_FAILED);
        router.push(`/company/jobs/${job.id}`);
        return;
      }
      toast.success("Job published. Recruiters can see it now.");
      router.push("/company/jobs");
    },
    onError: (error) => {
      toast.error(
        isApiError(error)
          ? error.message
          : "Could not post the job. Please try again.",
      );
    },
  });
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      input,
      benefitsDocument = null,
    }: {
      input: Partial<JobWriteInput> & { status?: JobStatus };
      benefitsDocument?: File | null;
    }) => withBenefitsDocument(await updateJob(id, input), benefitsDocument),
    onSuccess: ({ job, benefitsDocumentFailed }) => {
      queryClient.setQueryData(jobKeys.detail(id), job);
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      if (benefitsDocumentFailed) toast.error(BENEFITS_DOCUMENT_FAILED);
    },
  });
}

/**
 * Publishing is what puts a job in front of recruiters, so it is a distinct
 * action rather than a status dropdown. The toast no longer mentions
 * followers: the follow feature is hidden from the UI, so naming it would
 * promise something the reader cannot see.
 */
export function usePublishJob(id: string) {
  const update = useUpdateJob(id);
  return {
    publish: () =>
      update.mutate(
        { input: { status: "published" } },
        {
          onSuccess: () =>
            toast.success(
              "Job published. Recruiters can now submit candidates.",
            ),
        },
      ),
    isPending: update.isPending,
  };
}
