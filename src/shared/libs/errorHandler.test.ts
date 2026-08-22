import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";
import { allMessages, handleError, remainingMessages } from "./errorHandler";

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

  it("keeps every sentence the backend sent, not just the headline", () => {
    const error = axiosErrorWithBody({
      statusCode: 400,
      error: "Bad Request",
      message: [
        "Salary must be under $1,000,000,000",
        "An interview must end after it starts",
      ],
    });

    const apiError = handleError(error);

    expect(apiError.messages).toEqual([
      "Salary must be under $1,000,000,000",
      "An interview must end after it starts",
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
    expect(apiError.message).not.toMatch(
      /stack|trace|exception|at\s+\w+\.\w+/i,
    );
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

describe("remainingMessages", () => {
  it("reports the sentences the headline could not carry", () => {
    const apiError = handleError(
      axiosErrorWithBody({
        statusCode: 400,
        error: "Bad Request",
        message: [
          "Salary must be under $1,000,000,000",
          "An interview must end after it starts",
          "Pick a start date of today or later",
        ],
      }),
    );

    expect(remainingMessages(apiError)).toBe(
      "An interview must end after it starts. Pick a start date of today or later.",
    );
  });

  it("has nothing to add when the backend sent a single sentence", () => {
    const apiError = handleError(
      axiosErrorWithBody({
        statusCode: 409,
        error: "Conflict",
        message: "This candidate already has an offer awaiting a response.",
      }),
    );

    expect(remainingMessages(apiError)).toBeUndefined();
  });

  it("names no field paths or property names", () => {
    const apiError = handleError(
      axiosErrorWithBody({
        statusCode: 400,
        error: "Bad Request",
        message: ["Salary is required", "Recruiter fee is required"],
      }),
    );

    const description = remainingMessages(apiError);

    expect(description).toBe("Recruiter fee is required.");
    expect(description).not.toMatch(/Minor|[a-z][A-Z]|\bfields?\b/);
  });
});

describe("allMessages", () => {
  it("keeps every sentence for a caller with only one line to render", () => {
    const apiError = handleError(
      axiosErrorWithBody({
        statusCode: 400,
        error: "Bad Request",
        message: [
          "Salary must be under $1,000,000,000",
          "Pick a start date of today or later",
        ],
      }),
    );

    expect(allMessages(apiError)).toBe(
      "Salary must be under $1,000,000,000. Pick a start date of today or later.",
    );
  });

  it("leaves a single sentence exactly as the backend wrote it", () => {
    const apiError = handleError(
      axiosErrorWithBody({
        statusCode: 409,
        error: "Conflict",
        message: "This interview is no longer awaiting a time.",
      }),
    );

    expect(allMessages(apiError)).toBe(
      "This interview is no longer awaiting a time.",
    );
  });
});
