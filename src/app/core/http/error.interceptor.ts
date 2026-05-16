import type { HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { toAppError } from './app-error';

/**
 * Single producer of AppError. Catches anything thrown downstream of the
 * HTTP boundary, maps it to a typed AppError, and re-throws. Logs to the
 * console in dev so failed requests stay visible during development —
 * production is silent (UI surfaces error states via Transloco keys).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      const appError = toAppError(err, req);
      if (isDevMode()) {
        console.error(`[http] ${req.method} ${req.url} →`, appError.kind, appError);
      }
      return throwError(() => appError);
    }),
  );
