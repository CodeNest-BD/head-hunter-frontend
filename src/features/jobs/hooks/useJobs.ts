import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createJob,
  deleteJob,
  fetchJob,
  fetchJobMap,
  fetchJobs,
  updateJob,
  type JobFilterParams,
  type JobListParams,
  type JobWriteInput,
} from "../api/jobs";
import { jobKeys } from "../keys";
import type { JobStatus } from "../schemas";

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
    mutationFn: (input: JobWriteInput) => createJob(input),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Draft saved");
      router.push(`/company/jobs/${job.id}`);
    },
  });
}

/**
 * Create a job and publish it in one action (the "Publish" button on the new-job
 * form). Publishing reserves the fee, so it can fail on insufficient funds — the
 * draft is already saved, and the error surfaces so the company can top up and
 * publish from the job page.
 */
export function useCreateAndPublishJob() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (input: JobWriteInput) => {
      const draft = await createJob(input);
      return updateJob(draft.id, { status: "published" });
    },
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
      toast.success("Job published. Recruiters can see it now.");
      router.push(`/company/jobs/${job.id}`);
    },
  });
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<JobWriteInput> & { status?: JobStatus }) =>
      updateJob(id, input),
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(id), job);
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

/**
 * Publishing is the moment followers get notified, so it is a distinct action
 * rather than a status dropdown — and it says so in the toast.
 */
export function usePublishJob(id: string) {
  const update = useUpdateJob(id);
  return {
    publish: () =>
      update.mutate(
        { status: "published" },
        {
          onSuccess: () =>
            toast.success("Job published. Followers have been notified."),
        },
      ),
    isPending: update.isPending,
  };
}
