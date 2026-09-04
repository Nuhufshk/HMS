/**
 * Shared error type used by the API client.
 * Components catch this to show user-friendly messages.
 */
export class MockApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
