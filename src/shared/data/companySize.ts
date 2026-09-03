/**
 * Standard company-size buckets for the "Number of Employees" field. A fixed
 * list (picked, not typed) keeps the field free of stray text while preserving
 * the range semantics the field always had ("51-200"). Stored as the label
 * string, so the value is human-readable wherever it's shown.
 */
export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1001-5000",
  "5001-10000",
  "10000+",
] as const;
