import { HttpErrorResponse, type HttpRequest } from '@angular/common/http';

/**
 * Normalized failure shape every UI in the app speaks. The error interceptor
 * is the single producer; downstream code matches on `kind` exhaustively.
 *
 * `cause` is kept opaque (`unknown`) so callers cannot accidentally reach into
 * Angular's HttpErrorResponse and re-leak its shape into templates.
 */
export type AppError =
  | { kind: 'network'; message: string; cause: unknown }
  | { kind: 'not-found'; url: string; cause: unknown }
  | { kind: 'rate-limit'; retryAfterMs: number | null; cause: unknown }
  | { kind: 'server'; status: number; cause: unknown }
  | { kind: 'unknown'; cause: unknown };

const parseRetryAfter = (value: string | null): number | null => {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
};

export const toAppError = (err: unknown, req: HttpRequest<unknown>): AppError => {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return { kind: 'network', message: err.message, cause: err };
    }
    if (err.status === 404) {
      return { kind: 'not-found', url: req.url, cause: err };
    }
    if (err.status === 429) {
      return {
        kind: 'rate-limit',
        retryAfterMs: parseRetryAfter(err.headers.get('retry-after')),
        cause: err,
      };
    }
    if (err.status >= 500) {
      return { kind: 'server', status: err.status, cause: err };
    }
  }
  return { kind: 'unknown', cause: err };
};

/**
 * i18n key for an AppError. UI components map to these via Transloco. Keeping
 * the mapping here keeps templates free of inline ternaries.
 */
export const appErrorTranslationKey = (error: AppError): string => {
  switch (error.kind) {
    case 'network':
      return 'errors.network';
    case 'not-found':
      return 'errors.notFound';
    case 'rate-limit':
      return 'errors.rateLimit';
    case 'server':
      return 'errors.server';
    case 'unknown':
      return 'errors.unknown';
  }
};
