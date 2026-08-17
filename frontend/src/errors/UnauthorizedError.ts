class UnauthorizedError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UnauthorizedError";
    this.status = status;
  }
}

export default UnauthorizedError;

// Login failed
// 401 Unauthorized
// The credentials provided do not match any account.
