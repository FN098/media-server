import { AppErrorCode } from "@/lib/errors/app-error-codes";

type ErrorResponseOptions = {
  code?: AppErrorCode;
  message?: string;
} & Record<string, unknown>;

function errorResponse(
  status: number,
  error: string,
  options?: ErrorResponseOptions
): Response {
  return Response.json(
    {
      error,
      ...(options ?? {}),
    },
    { status }
  );
}

export const badRequestResponse = (options?: ErrorResponseOptions) =>
  errorResponse(400, "Bad Request", options);

export const unauthorizedResponse = (options?: ErrorResponseOptions) =>
  errorResponse(401, "Unauthorized", options);

export const forbiddenResponse = (options?: ErrorResponseOptions) =>
  errorResponse(403, "Forbidden", options);

export const notFoundResponse = (options?: ErrorResponseOptions) =>
  errorResponse(404, "Not Found", options);

export const conflictResponse = (options?: ErrorResponseOptions) =>
  errorResponse(409, "Conflict", options);

export const internalServerErrorResponse = (options?: ErrorResponseOptions) =>
  errorResponse(500, "Internal Server Error", options);
