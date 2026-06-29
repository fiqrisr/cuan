export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code?: string, details?: unknown) {
    super(400, message, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: string, details?: unknown) {
    super(401, message, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: string, details?: unknown) {
    super(403, message, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found', code?: string, details?: unknown) {
    super(404, message, code, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', code?: string, details?: unknown) {
    super(500, message, code, details);
  }
}
