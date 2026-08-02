import { z } from "zod";

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * Wraps an item schema in the API's `{ data, meta }` envelope so each endpoint
 * declares only what it returns.
 */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({ data: z.array(item), meta: paginationMetaSchema });
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}
