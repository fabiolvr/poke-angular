import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HttpCacheStore } from './http-cache.store';

const makeResponse = (body: unknown): HttpResponse<unknown> =>
  new HttpResponse({ status: 200, body });

describe('HttpCacheStore', () => {
  let store: HttpCacheStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(HttpCacheStore);
    store.clear();
  });

  it('returns null on miss and the stored response on hit', () => {
    expect(store.get('a')).toBeNull();
    const res = makeResponse({ id: 1 });
    store.set('a', res);
    expect(store.get('a')?.body).toEqual({ id: 1 });
  });

  it('promotes a hit to most-recently-used by deleting then reinserting', () => {
    store.set('a', makeResponse(1));
    store.set('b', makeResponse(2));
    store.set('c', makeResponse(3));

    // Touch 'a' — now insertion order is [b, c, a].
    store.get('a');

    // Cap is 200; bypass by forcing many inserts is overkill. Instead, verify
    // insertion order via a private peek through iteration: re-set 'b' so its
    // recency moves to the tail, and confirm 'a' is no longer the oldest by
    // checking that clearing one slot at the head wouldn't remove it.
    const keys = Array.from((store as unknown as { cache: Map<string, unknown> }).cache.keys());
    expect(keys).toEqual(['b', 'c', 'a']);
  });

  it('clear empties the cache', () => {
    store.set('a', makeResponse(1));
    store.clear();
    expect(store.size).toBe(0);
    expect(store.get('a')).toBeNull();
  });
});
