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
import type { JobStatus } from "../schemas";

export const jobsKey = (params: JobListParams) => ["jobs", params] as const;
export const jobKey = (id: string) => ["job", id] as const;

export function useJobs(params: JobListParams) {
  return useQuery({
    queryKey: jobsKey(params),
    queryFn: () => fetchJobs(params),
  });
}

export function useJob(id: string) {
  return useQuery({ queryKey: jobKey(id), queryFn: () => fetchJob(id) });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: JobWriteInput) => createJob(input),
    onSuccess: (job) => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
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
      queryClient.setQueryData(jobKey(id), job);
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
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
