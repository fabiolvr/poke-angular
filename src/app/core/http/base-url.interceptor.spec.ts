import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, it } from 'vitest';
import { baseUrlInterceptor, POKE_API_BASE_URL } from './base-url.interceptor';

describe('baseUrlInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([baseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('prepends the PokéAPI base to relative URLs', () => {
    http.get('pokemon/25').subscribe();
    const req = httpMock.expectOne(`${POKE_API_BASE_URL}pokemon/25`);
    req.flush({});
  });

  it('leaves absolute URLs untouched', () => {
    http.get('https://example.com/data').subscribe();
    httpMock.expectOne('https://example.com/data').flush({});
  });

  it('leaves leading-slash (local) URLs untouched', () => {
    http.get('/i18n/pt-BR.json').subscribe();
    httpMock.expectOne('/i18n/pt-BR.json').flush({});
  });
});
