import { HttpErrorResponse, HttpHeaders, HttpRequest } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { appErrorOf, appErrorTranslationKey, toAppError, type AppError } from './app-error';

const makeRequest = (url: string): HttpRequest<unknown> => new HttpRequest('GET', url);

const makeHttpError = (init: {
  status: number;
  url?: string;
  headers?: Record<string, string>;
}): HttpErrorResponse =>
  new HttpErrorResponse({
    status: init.status,
    url: init.url ?? 'https://pokeapi.co/api/v2/pokemon/1',
    headers: init.headers ? new HttpHeaders(init.headers) : new HttpHeaders(),
    error: 'boom',
  });

describe('toAppError', () => {
  it('maps status 0 to a network error', () => {
    const err = toAppError(makeHttpError({ status: 0 }), makeRequest('pokemon/1'));
    expect(err.kind).toBe('network');
  });

  it('maps 404 to not-found preserving the requested URL', () => {
    const err = toAppError(makeHttpError({ status: 404 }), makeRequest('pokemon/foo'));
    expect(err.kind).toBe('not-found');
    if (err.kind === 'not-found') {
      expect(err.url).toBe('pokemon/foo');
    }
  });

  it('maps 429 and parses Retry-After in seconds', () => {
    const err = toAppError(
      makeHttpError({ status: 429, headers: { 'Retry-After': '30' } }),
      makeRequest('pokemon/1'),
    );
    expect(err.kind).toBe('rate-limit');
    if (err.kind === 'rate-limit') {
      expect(err.retryAfterMs).toBe(30_000);
    }
  });

  it('returns null retryAfterMs when header is absent', () => {
    const err = toAppError(makeHttpError({ status: 429 }), makeRequest('pokemon/1'));
    expect(err.kind).toBe('rate-limit');
    if (err.kind === 'rate-limit') {
      expect(err.retryAfterMs).toBeNull();
    }
  });

  it('maps 5xx to server error', () => {
    const err = toAppError(makeHttpError({ status: 503 }), makeRequest('pokemon/1'));
    expect(err.kind).toBe('server');
    if (err.kind === 'server') {
      expect(err.status).toBe(503);
    }
  });

  it('falls through to unknown for non-Http errors', () => {
    const err = toAppError(new Error('parse failure'), makeRequest('pokemon/1'));
    expect(err.kind).toBe('unknown');
  });
});

describe('appErrorOf', () => {
  const sample: AppError = { kind: 'not-found', url: 'pokemon/missingno', cause: null };

  it('returns the value when it is already an AppError', () => {
    expect(appErrorOf(sample)).toBe(sample);
  });

  it('unwraps an AppError sitting on Error.cause (rxResource wraps non-Errors)', () => {
    const wrapper = new Error('Resource returned an error');
    (wrapper as { cause: unknown }).cause = sample;
    expect(appErrorOf(wrapper)).toBe(sample);
  });

  it('returns null for unknown shapes', () => {
    expect(appErrorOf(null)).toBeNull();
    expect(appErrorOf(undefined)).toBeNull();
    expect(appErrorOf('boom')).toBeNull();
    expect(appErrorOf({ kind: 'something-else' })).toBeNull();
    expect(appErrorOf(new Error('plain error'))).toBeNull();
  });
});

describe('appErrorTranslationKey', () => {
  it('returns a stable key per kind', () => {
    const cases: { input: AppError; expected: string }[] = [
      { input: { kind: 'network', message: '', cause: null }, expected: 'errors.network' },
      { input: { kind: 'not-found', url: '', cause: null }, expected: 'errors.notFound' },
      {
        input: { kind: 'rate-limit', retryAfterMs: null, cause: null },
        expected: 'errors.rateLimit',
      },
      { input: { kind: 'server', status: 500, cause: null }, expected: 'errors.server' },
      { input: { kind: 'unknown', cause: null }, expected: 'errors.unknown' },
    ];
    for (const { input, expected } of cases) {
      expect(appErrorTranslationKey(input)).toBe(expected);
    }
  });
});
