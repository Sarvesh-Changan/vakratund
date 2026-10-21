export class AuthHttpError extends Error {
  readonly status: 401 | 403;
  readonly code: string;

  constructor(status: 401 | 403, message: string, code = status === 401 ? "AUTHENTICATION_REQUIRED" : "FORBIDDEN") {
    super(message);
    this.name = "AuthHttpError";
    this.status = status;
    this.code = code;
  }
}
