import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchAdminStats,
  fetchCompanies,
  fetchCompany,
  fetchConversation,
  fetchConversations,
  fetchRecruiter,
  fetchRecruiters,
  reinstateAccount,
  suspendAccount,
} from "../api/admin";
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

export function useAdminConversation(submissionId: string) {
  return useQuery({
    queryKey: adminKeys.conversation(submissionId),
    queryFn: () => fetchConversation(submissionId),
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
