import { AppErrorCode } from "@/lib/errors/app-error-codes";

type AppErrorOptions = ErrorOptions & Record<string, unknown>;

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly details: Record<string, unknown>;

  constructor(code: AppErrorCode, message?: string, options?: AppErrorOptions) {
    const { cause, ...details } = options ?? {};

    super(message, { cause });

    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
