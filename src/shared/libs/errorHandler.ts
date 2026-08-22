import { AxiosError } from "axios";
import { z } from "zod";

/**
 * Per-field validation detail from the backend's `fields[]` array.
 * `reasons` holds class-validator constraint keys (e.g. `slotHasUtcOffset`) —
 * machine-readable, so form-level copy never has to explain itself.
 */
export interface ApiErrorField {
  field: string;
  messages: string[];
  reasons: string[];
}

// Shown when the server response doesn't match any known shape (unexpected
// JSON, an HTML error page, no response at all). Never let the caller see
// Axios's transport text (e.g. "Request failed with status code 400") or an
// internal detail — this sentence is deliberately generic and detail-free.
const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/**
 * Single error class thrown by apiClient's response interceptor on non-2xx
 * responses. Carries the parsed server message, the HTTP status, and an
 * optional stable machine-readable `code` (e.g. `role_required`) so callers
 * can branch on cause rather than pattern-matching the human message.
 */
export class ApiError extends Error {
  readonly kind = "ApiError" as const;
  readonly statusCode?: number;
  readonly details?: string;
  readonly code?: string;
  /** Every sentence the backend sent, in order. `message` is just the first. */
  readonly messages?: string[];
  /** Per-field detail for form display, when the backend sent one. */
  readonly fields?: ApiErrorField[];

  constructor(
    message: string,
    opts?: {
      statusCode?: number;
      details?: string;
      code?: string;
      messages?: string[];
      fields?: ApiErrorField[];
      cause?: unknown;
    },
  ) {
    super(message, { cause: opts?.cause });
    this.name = "ApiError";
    this.statusCode = opts?.statusCode;
    this.details = opts?.details;
    this.code = opts?.code;
    this.messages = opts?.messages;
    this.fields = opts?.fields;
    // Preserve prototype across transpilation targets that downlevel `class`.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// Backend error-response shapes. Validated rather than indexed so a malformed
// body (HTML 502 page, unknown shape) falls through to a human fallback
// instead of injecting an object into a string field.
const NestExceptionBody = z.object({
  message: z.string().min(1),
  error: z.string().optional(),
  code: z.string().optional(),
});

const NestValidationBody = z.object({
  message: z.array(z.string().min(1)).min(1),
  error: z.string().optional(),
  fields: z
    .array(
      z.object({
        field: z.string(),
        messages: z.array(z.string()),
        reasons: z.array(z.string()),
      }),
    )
    .optional(),
});

type ParsedBody = {
  message: string;
  messages?: string[];
  details?: string;
  code?: string;
  fields?: ApiErrorField[];
};

function parseErrorBody(data: unknown): ParsedBody | null {
  const nestValidation = NestValidationBody.safeParse(data);
  if (nestValidation.success) {
    // Surface the first sentence as the headline — a toast with several
    // semicolon-joined clauses is not readable. The full list (and the
    // richer per-field `fields`) stays available for form-level display.
    const [headline] = nestValidation.data.message;
    return {
      message: headline,
      messages: nestValidation.data.message,
      details: nestValidation.data.error,
      fields: nestValidation.data.fields,
    };
  }

  const nestException = NestExceptionBody.safeParse(data);
  if (nestException.success) {
    return {
      message: nestException.data.message,
      details: nestException.data.error,
      code: nestException.data.code,
    };
  }

  return null;
}

export function handleError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const parsed = parseErrorBody(error.response?.data);
    return new ApiError(parsed?.message ?? FALLBACK_MESSAGE, {
      statusCode: error.response?.status,
      details: parsed?.details ?? error.name,
      code: parsed?.code,
      messages: parsed?.messages,
      fields: parsed?.fields,
      cause: error,
    });
  }
  if (error instanceof Error) {
    return new ApiError(error.message, { details: error.name, cause: error });
  }
  const withMessage = z.object({ message: z.unknown() }).safeParse(error);
  const message = withMessage.success
    ? String(withMessage.data.message)
    : "An unknown error occurred";
  return new ApiError(message, { cause: error });
}
