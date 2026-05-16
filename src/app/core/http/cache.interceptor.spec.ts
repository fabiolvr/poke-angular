import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cacheInterceptor } from './cache.interceptor';
import { HttpCacheStore } from './http-cache.store';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let store: HttpCacheStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    store = TestBed.inject(HttpCacheStore);
    store.clear();
  });

  afterEach(() => httpMock.verify());

  it('passes through and stores the response on first GET', () => {
    let payload: unknown = null;
    http.get('https://api/x').subscribe((res) => (payload = res));
    httpMock.expectOne('https://api/x').flush({ ok: true });
    expect(payload).toEqual({ ok: true });
    expect(store.size).toBe(1);
  });

  it('serves the second GET from cache without hitting the network', () => {
    http.get('https://api/x').subscribe();
    httpMock.expectOne('https://api/x').flush({ ok: true });

    let payload: unknown = null;
    http.get('https://api/x').subscribe((res) => (payload = res));
    httpMock.expectNone('https://api/x');
    expect(payload).toEqual({ ok: true });
  });

  it('does not cache non-GET requests', () => {
    http.post('https://api/x', {}).subscribe();
    httpMock.expectOne('https://api/x').flush({});
    expect(store.size).toBe(0);
  });

  it('does not cache errored responses', () => {
    http.get('https://api/x').subscribe({ error: () => undefined });
    httpMock
      .expectOne('https://api/x')
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    expect(store.size).toBe(0);
  });
});
