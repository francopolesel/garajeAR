export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) => new HttpError(400, "BAD_REQUEST", msg, details);
export const unauthorized = (msg = "Unauthorized") => new HttpError(401, "UNAUTHORIZED", msg);
export const forbidden = (msg = "Forbidden") => new HttpError(403, "FORBIDDEN", msg);
export const notFound = (msg = "Not found") => new HttpError(404, "NOT_FOUND", msg);
export const conflict = (msg: string) => new HttpError(409, "CONFLICT", msg);
export const tooMany = (msg = "Too many requests") => new HttpError(429, "RATE_LIMITED", msg);
export const serverError = (msg = "Internal server error") => new HttpError(500, "INTERNAL_ERROR", msg);
