import { AxiosError } from "axios";
import { z } from "zod";

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

  constructor(
    message: string,
    opts?: {
      statusCode?: number;
      details?: string;
      code?: string;
      cause?: unknown;
    },
  ) {
    super(message, { cause: opts?.cause });
    this.name = "ApiError";
    this.statusCode = opts?.statusCode;
    this.details = opts?.details;
    this.code = opts?.code;
    // Preserve prototype across transpilation targets that downlevel `class`.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// Backend error-response shapes. Validated rather than indexed so a malformed
// body (HTML 502 page, unknown shape) falls through to the transport-level
// message instead of injecting an object into a string field.
const NestExceptionBody = z.object({
  message: z.string().min(1),
  error: z.string().optional(),
  code: z.string().optional(),
});

const NestValidationBody = z.object({
  message: z.array(z.string().min(1)).min(1),
  error: z.string().optional(),
});

type ParsedBody = { message: string; details?: string; code?: string };

function parseErrorBody(data: unknown): ParsedBody | null {
  const nestValidation = NestValidationBody.safeParse(data);
  if (nestValidation.success) {
    return {
      message: nestValidation.data.message.join("; "),
      details: nestValidation.data.error,
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
    return new ApiError(parsed?.message ?? error.message, {
      statusCode: error.response?.status,
      details: parsed?.details ?? error.name,
      code: parsed?.code,
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
