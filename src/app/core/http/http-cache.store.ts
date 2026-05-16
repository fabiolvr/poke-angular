import { type HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * In-memory LRU store for cached HTTP GET responses.
 *
 * PokéAPI resources are functionally immutable for our purposes, so we never
 * invalidate by TTL — entries are only evicted when the cache reaches its
 * configured cap, oldest-first. Cap defaults to 200 (~entire generation 1
 * worth of pokemon + species data).
 *
 * localStorage was considered (see PENDENCIAS / Fase 8 ADR) but rejected:
 * the resource payloads are large, invalidation across schema updates is
 * fragile, and the in-memory store is enough for SPA-lifetime browsing.
 */
@Injectable({ providedIn: 'root' })
export class HttpCacheStore {
  private readonly cache = new Map<string, HttpResponse<unknown>>();
  private readonly maxSize = 200;

  get<T>(url: string): HttpResponse<T> | null {
    const hit = this.cache.get(url);
    if (!hit) return null;
    // Bump to most-recently-used position by reinserting.
    this.cache.delete(url);
    this.cache.set(url, hit);
    return hit as HttpResponse<T>;
  }

  set(url: string, response: HttpResponse<unknown>): void {
    if (this.cache.has(url)) {
      this.cache.delete(url);
    } else if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(url, response);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
