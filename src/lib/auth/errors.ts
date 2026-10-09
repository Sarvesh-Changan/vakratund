export class AuthHttpError extends Error {
  readonly status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthHttpError";
    this.status = status;
  }
}
