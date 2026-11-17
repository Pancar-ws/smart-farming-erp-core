// src/core/api/errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500;
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    const e = body.error ?? body;
    return new ApiError(
      res.status,
      e.code ?? 'UNKNOWN',
      e.message ?? e.detail ?? res.statusText,
      e.details ?? {}
    );
  } catch {
    return new ApiError(res.status, 'UNKNOWN', res.statusText || 'Terjadi kesalahan pada server.');
  }
}

