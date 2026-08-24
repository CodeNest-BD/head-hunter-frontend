import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchCompanies, type CompanyListParams } from "../api/companyProfiles";
import { companyKeys } from "../keys";

export function useCompanies(params: CompanyListParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => fetchCompanies(params),
    // Keep the current page of cards visible while the next page/search loads.
    placeholderData: keepPreviousData,
  });
}
