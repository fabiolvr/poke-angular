import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TranslationService } from './translation.service';

const ENDPOINT = 'https://api.mymemory.translated.net/get';

const setup = () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), TranslationService],
  });
  return {
    service: TestBed.inject(TranslationService),
    http: TestBed.inject(HttpTestingController),
  };
};

describe('TranslationService', () => {
  beforeEach(() => {
    // Each spec starts with a fresh TestBed automatically via configureTestingModule.
  });

  it('returns the source text untouched when the input is empty', () => {
    const { service, http } = setup();
    const observed: string[] = [];
    service.translate('', 'en', 'pt-br').subscribe((v) => observed.push(v));
    expect(observed).toEqual(['']);
    http.expectNone(() => true);
  });

  it('translates via MyMemory and resolves to the responseData.translatedText', () => {
    const { service, http } = setup();
    const observed: string[] = [];
    service.translate('Hello world', 'en', 'pt-br').subscribe((v) => observed.push(v));

    const req = http.expectOne((r) => r.url === ENDPOINT && r.params.get('q') === 'Hello world');
    expect(req.request.params.get('langpair')).toBe('en|pt-br');
    req.flush({ responseStatus: 200, responseData: { translatedText: 'Olá, mundo' } });
    expect(observed).toEqual(['Olá, mundo']);
  });

  it('caches by source text — second call hits no network', () => {
    const { service, http } = setup();
    service.translate('Cached input', 'en', 'pt-br').subscribe();
    http
      .expectOne((r) => r.url === ENDPOINT)
      .flush({ responseStatus: 200, responseData: { translatedText: 'Entrada em cache' } });

    const observed: string[] = [];
    service.translate('Cached input', 'en', 'pt-br').subscribe((v) => observed.push(v));
    expect(observed).toEqual(['Entrada em cache']);
    http.expectNone(() => true);
  });

  it('deduplicates concurrent calls for the same key into one HTTP request', () => {
    const { service, http } = setup();
    const a: string[] = [];
    const b: string[] = [];
    service.translate('Same text', 'en', 'pt-br').subscribe((v) => a.push(v));
    service.translate('Same text', 'en', 'pt-br').subscribe((v) => b.push(v));

    const reqs = http.match((r) => r.url === ENDPOINT);
    expect(reqs).toHaveLength(1);
    reqs[0]?.flush({ responseStatus: 200, responseData: { translatedText: 'Mesmo texto' } });
    expect(a).toEqual(['Mesmo texto']);
    expect(b).toEqual(['Mesmo texto']);
  });

  it('falls back to the source text on HTTP errors', () => {
    const { service, http } = setup();
    const observed: string[] = [];
    service.translate('Boom text', 'en', 'pt-br').subscribe((v) => observed.push(v));
    http
      .expectOne((r) => r.url === ENDPOINT)
      .flush('', { status: 500, statusText: 'Server Error' });
    expect(observed).toEqual(['Boom text']);
  });

  it('engages a cooldown after 429 and skips the network for an hour', () => {
    const { service, http } = setup();
    service.translate('Limited', 'en', 'pt-br').subscribe();
    http
      .expectOne((r) => r.url === ENDPOINT)
      .flush('', { status: 429, statusText: 'Too Many Requests' });

    const observed: string[] = [];
    service.translate('Different text', 'en', 'pt-br').subscribe((v) => observed.push(v));
    expect(observed).toEqual(['Different text']);
    http.expectNone(() => true);
  });
});
