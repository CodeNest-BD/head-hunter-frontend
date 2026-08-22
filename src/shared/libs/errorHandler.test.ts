import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { handleError } from "./errorHandler";

/**
 * Builds a real AxiosError carrying the given response body, mirroring what
 * apiClient's response interceptor receives from a failed request. Built
 * from typed axios primitives rather than a loose object literal so the
 * shape stays honest to what the interceptor actually sees.
 */
function axiosErrorWithBody(data: unknown, status = 400): AxiosError {
  const config: InternalAxiosRequestConfig = { headers: new AxiosHeaders() };
  const response: AxiosResponse = {
    data,
    status,
    statusText: "",
    headers: new AxiosHeaders(),
    config,
  };
  return new AxiosError(
    `Request failed with status code ${status}`,
    undefined,
    config,
    undefined,
    response,
  );
}

describe("handleError", () => {
  it("shows one readable sentence rather than a semicolon-joined wall", () => {
    const error = axiosErrorWithBody({
      statusCode: 400,
      error: "Bad Request",
      message: [
        "Salary must be under $1,000,000,000",
        "An interview must end after it starts",
      ],
    });

    const apiError = handleError(error);

    expect(apiError.message).toBe("Salary must be under $1,000,000,000");
    expect(apiError.message).not.toContain(";");
  });

  it("keeps every sentence and the per-field detail available for form display", () => {
    const error = axiosErrorWithBody({
      statusCode: 400,
      error: "Bad Request",
      message: ["Salary must be under $1,000,000,000"],
      fields: [
        {
          field: "salaryMaxMinor",
          messages: ["Salary must be under $1,000,000,000"],
          reasons: ["max"],
        },
      ],
    });

    const apiError = handleError(error);

    expect(apiError.messages).toEqual(["Salary must be under $1,000,000,000"]);
    expect(apiError.fields).toEqual([
      {
        field: "salaryMaxMinor",
        messages: ["Salary must be under $1,000,000,000"],
        reasons: ["max"],
      },
    ]);
  });

  it("falls back to a human sentence when the body shape is unrecognised", () => {
    const error = axiosErrorWithBody({ unexpected: true });

    const apiError = handleError(error);

    expect(apiError.message).not.toMatch(/status code/i);
    expect(apiError.message).toBe("Something went wrong. Please try again.");
  });

  it("never surfaces a 500's internal detail", () => {
    const error = axiosErrorWithBody(
      {
        statusCode: 500,
        error: "Internal Server Error",
        message: "Something went wrong on our end. This has been logged.",
      },
      500,
    );

    const apiError = handleError(error);

    expect(apiError.message).toBe(
      "Something went wrong on our end. This has been logged.",
    );
    expect(apiError.message).not.toMatch(/stack|trace|exception|at\s+\w+\.\w+/i);
  });

  it("falls back to a human sentence for a 500 with an unrecognised body", () => {
    const error = axiosErrorWithBody(
      "<html><body>Internal Server Error</body></html>",
      500,
    );

    const apiError = handleError(error);

    expect(apiError.message).toBe("Something went wrong. Please try again.");
    expect(apiError.message).not.toContain("<html>");
  });
});
