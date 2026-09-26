import { toast } from "sonner";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  changeAdminPassword,
  createAdmin,
  bulkDeleteAdminJobs,
  bulkRepostAdminJobs,
  deleteAdminJob,
  deleteRecruiter,
  decideCompanyVerification,
  decideRecruiterVerification,
  fetchAdmins,
  fetchAdminStats,
  fetchCompanies,
  fetchCompany,
  fetchConversation,
  fetchConversations,
  fetchJobs,
  fetchRecruiter,
  fetchMinRecruiterFeeSetting,
  fetchRecruiterPricing,
  fetchRecruiters,
  reinstateAccount,
  removeAdmin,
  suspendAccount,
  updateMinRecruiterFee,
  updateAdmin,
  repostAdminJob,
  updateAdminJob,
  updateRecruiterPricing,
  type CreateAdminInput,
  type VerificationDecisionInput,
} from "../api/admin";
import type { BulkJobActionResult } from "../schemas";
import { adminKeys, type AdminListParams } from "../keys";

export function useAdminStats() {
  return useQuery({ queryKey: adminKeys.stats, queryFn: fetchAdminStats });
}

export function useAdminRecruiters(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.recruiters(params),
    queryFn: () => fetchRecruiters(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminRecruiter(userId: string) {
  return useQuery({
    queryKey: adminKeys.recruiter(userId),
    queryFn: () => fetchRecruiter(userId),
  });
}

export function useDecideRecruiterVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerificationDecisionInput) =>
      decideRecruiterVerification(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "recruiters"],
      });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.recruiter(input.userId),
      });
      toast.success(
        input.status === "verified"
          ? "Recruiter verified — they now have full access"
          : "Recruiter rejected — they have been notified",
      );
    },
  });
}

export function useDecideCompanyVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VerificationDecisionInput) =>
      decideCompanyVerification(input),
    onSuccess: (_, input) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "companies"] });
      void queryClient.invalidateQueries({
        queryKey: adminKeys.company(input.userId),
      });
      toast.success(
        input.status === "verified"
          ? "Company approved — they now have full access"
          : "Company declined — they have been notified",
      );
    },
  });
}

export function useMinRecruiterFeeSetting() {
  return useQuery({
    queryKey: adminKeys.minRecruiterFee,
    queryFn: fetchMinRecruiterFeeSetting,
  });
}

export function useUpdateMinRecruiterFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountMinor: number) => updateMinRecruiterFee(amountMinor),
    onSuccess: (setting) => {
      queryClient.setQueryData(adminKeys.minRecruiterFee, setting);
      toast.success("Minimum recruiter fee updated");
    },
  });
}

export function useAdminCompanies(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.companies(params),
    queryFn: () => fetchCompanies(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminCompany(userId: string) {
  return useQuery({
    queryKey: adminKeys.company(userId),
    queryFn: () => fetchCompany(userId),
  });
}

export function useAdminConversations(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.conversations(params),
    queryFn: () => fetchConversations(params),
    placeholderData: keepPreviousData,
  });
}

const FIRST_PAGE = 1;

/**
 * Admin pages through the same `{ data, meta }` envelope the participant
 * thread does (`useConversationThread`), so this is an infinite query too:
 * each fetched page lands in TanStack Query's own page cache and "load
 * older" asks for the next-older page.
 */
export function useAdminConversation(submissionId: string) {
  return useInfiniteQuery({
    queryKey: adminKeys.conversation(submissionId),
    queryFn: ({ pageParam }) => fetchConversation(submissionId, pageParam),
    initialPageParam: FIRST_PAGE,
    getNextPageParam: (lastPage) =>
      lastPage.events.meta.page < lastPage.events.meta.totalPages
        ? lastPage.events.meta.page + 1
        : undefined,
  });
}

/**
 * Suspend/reinstate. Both invalidate every admin query so the directory rows
 * and any open detail view reflect the new status immediately.
 */
export function useSuspendAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      suspendAccount(userId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useReinstateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => reinstateAccount(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useAdminJobs(params: AdminListParams) {
  return useQuery({
    queryKey: adminKeys.jobs(params),
    queryFn: () => fetchJobs(params),
    placeholderData: keepPreviousData,
  });
}

export function useRecruiterPricing() {
  return useQuery({
    queryKey: adminKeys.pricing,
    queryFn: fetchRecruiterPricing,
  });
}

export function useUpdateRecruiterPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountMinor: number) => updateRecruiterPricing(amountMinor),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.pricing });
    },
  });
}

export function useAdmins() {
  return useQuery({ queryKey: adminKeys.admins, queryFn: fetchAdmins });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminInput) => createAdmin(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.admins });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => removeAdmin(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.admins });
    },
  });
}

export function useChangeAdminPassword() {
  return useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      changeAdminPassword(userId, password),
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      firstName,
      lastName,
    }: {
      userId: string;
      firstName: string;
      lastName: string;
    }) => updateAdmin(userId, { firstName, lastName }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.admins });
      toast.success("Admin updated");
    },
  });
}

export function useDeleteRecruiter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteRecruiter(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "recruiters"] });
      toast.success("Recruiter deleted");
    },
  });
}

export function useDeleteAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => deleteAdminJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast.success("Job deleted");
    },
  });
}

/** Publish an expired listing for 30 more days. */
export function useRepostAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => repostAdminJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job re-posted for 30 days");
    },
  });
}

/**
 * One toast per bulk outcome: the wins as success, the skips as an error that
 * names the first reason — a mixed batch must never read as a clean sweep.
 */
function announceBulkOutcome(verb: string, result: BulkJobActionResult): void {
  if (result.succeeded > 0) {
    toast.success(
      `${verb} ${result.succeeded} job${result.succeeded === 1 ? "" : "s"}`,
    );
  }
  if (result.failed.length > 0) {
    const [first] = result.failed;
    const more =
      result.failed.length > 1 ? ` (+${result.failed.length - 1} more)` : "";
    toast.error(
      `${result.failed.length} job${result.failed.length === 1 ? "" : "s"} skipped: ${first.reason}${more}`,
    );
  }
}

export function useBulkRepostAdminJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobIds: string[]) => bulkRepostAdminJobs(jobIds),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      announceBulkOutcome("Re-posted", result);
    },
  });
}

export function useBulkDeleteAdminJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobIds: string[]) => bulkDeleteAdminJobs(jobIds),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      announceBulkOutcome("Deleted", result);
    },
  });
}

export function useUpdateAdminJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      input,
    }: {
      jobId: string;
      input: Record<string, unknown>;
    }) => updateAdminJob(jobId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      toast.success("Job updated");
    },
  });
}
