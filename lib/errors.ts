export class RequestValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

export class ResourceNotFoundError extends Error {
  readonly status = 404;

  constructor(message: string) {
    super(message);
    this.name = 'ResourceNotFoundError';
  }
}

export class UpstreamServiceError extends Error {
  readonly status = 502;

  constructor(message: string) {
    super(message);
    this.name = 'UpstreamServiceError';
  }
}

export function getErrorStatus(error: unknown, fallbackStatus: number = 500): number {
  if (error instanceof RequestValidationError) return error.status;
  if (error instanceof ResourceNotFoundError) return error.status;
  if (error instanceof UpstreamServiceError) return error.status;
  return fallbackStatus;
}
