import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AppError } from './app-error';
import { errorInterceptor } from './error.interceptor';

// Object wrapper sidesteps TS's CFA — control flow doesn't cross the
// subscribe() callback, so a bare `let captured: AppError | null = null`
// would stay narrowed to `null`. Property access through an object holds
// the declared type.
const capture = (): { value: AppError | null } => ({ value: null });

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('translates HttpErrorResponse(404) to an AppError("not-found")', () => {
    const captured = capture();
    http.get('https://api/x').subscribe({
      error: (err: AppError) => {
        captured.value = err;
      },
    });
    httpMock.expectOne('https://api/x').flush({}, { status: 404, statusText: 'Not Found' });
    expect(captured.value?.kind).toBe('not-found');
  });

  it('translates HttpErrorResponse(429) with Retry-After to "rate-limit"', () => {
    const captured = capture();
    http.get('https://api/x').subscribe({
      error: (err: AppError) => {
        captured.value = err;
      },
    });
    httpMock.expectOne('https://api/x').flush(
      {},
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: { 'Retry-After': '5' },
      },
    );
    expect(captured.value?.kind).toBe('rate-limit');
    if (captured.value?.kind === 'rate-limit') {
      expect(captured.value.retryAfterMs).toBe(5_000);
    }
  });

  it('translates status 0 to a network AppError', () => {
    const captured = capture();
    http.get('https://api/x').subscribe({
      error: (err: AppError) => {
        captured.value = err;
      },
    });
    httpMock.expectOne('https://api/x').flush({}, { status: 0, statusText: 'Network Error' });
    expect(captured.value?.kind).toBe('network');
  });
});
