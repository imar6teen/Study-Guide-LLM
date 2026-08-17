class ServerError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ServerError";
    this.status = status;
  }
}

export default ServerError;

// Unexpected server error
// 500 Internal Server Error
// An unexpected server error occurred.
