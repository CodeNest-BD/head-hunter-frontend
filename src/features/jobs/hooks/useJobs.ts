import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createJob,
  fetchJob,
  fetchJobs,
  updateJob,
  type JobListParams,
  type JobWriteInput,
} from "../api/jobs";
import { jobKeys } from "../keys";
import type { JobStatus } from "../schemas";

export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: jobKeys.list(params),
    queryFn: () => fetchJobs(params),
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJob(id),
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
