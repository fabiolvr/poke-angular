import { describe, expect, it } from 'vitest';
import {
  buildPageItems,
  clampPage,
  pageItemRange,
  pageToOffset,
  parsePageParam,
  POKEMON_LIST_PAGE_SIZE,
  totalPages,
} from './page-param';

describe('parsePageParam', () => {
  it('returns 1 for null, undefined, and empty string', () => {
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam('')).toBe(1);
  });

  it('parses positive integers', () => {
    expect(parsePageParam('1')).toBe(1);
    expect(parsePageParam('42')).toBe(42);
  });

  it('returns 1 for non-numeric strings', () => {
    expect(parsePageParam('foo')).toBe(1);
    expect(parsePageParam('1a')).toBe(1);
  });

  it('returns 1 for decimals (page number must be integer)', () => {
    expect(parsePageParam('1.5')).toBe(1);
    expect(parsePageParam('2.0001')).toBe(1);
  });

  it('returns 1 for zero and negative values', () => {
    expect(parsePageParam('0')).toBe(1);
    expect(parsePageParam('-3')).toBe(1);
  });

  it('returns 1 for Infinity and NaN as strings', () => {
    expect(parsePageParam('Infinity')).toBe(1);
    expect(parsePageParam('NaN')).toBe(1);
  });
});

describe('pageToOffset', () => {
  it('maps page 1 to offset 0 with default page size', () => {
    expect(pageToOffset(1)).toBe(0);
  });

  it('maps page 3 to offset 40 with default page size 20', () => {
    expect(pageToOffset(3)).toBe(40);
  });

  it('accepts a custom page size', () => {
    expect(pageToOffset(4, 10)).toBe(30);
  });

  it('defaults page size to POKEMON_LIST_PAGE_SIZE', () => {
    expect(pageToOffset(2)).toBe(POKEMON_LIST_PAGE_SIZE);
  });
});

describe('totalPages', () => {
  it('returns 1 for empty totals (always show at least one page)', () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(-5)).toBe(1);
  });

  it('rounds up on partial pages', () => {
    expect(totalPages(21, 20)).toBe(2);
    expect(totalPages(1010, 20)).toBe(51);
  });

  it('handles exact multiples', () => {
    expect(totalPages(20, 20)).toBe(1);
    expect(totalPages(40, 20)).toBe(2);
  });
});

describe('clampPage', () => {
  it('returns the requested page when in range', () => {
    expect(clampPage(3, 100, 20)).toBe(3);
  });

  it('clamps low values up to 1', () => {
    expect(clampPage(0, 100, 20)).toBe(1);
    expect(clampPage(-9, 100, 20)).toBe(1);
  });

  it('clamps high values down to totalPages', () => {
    expect(clampPage(999, 100, 20)).toBe(5);
  });

  it('returns 1 when total is 0', () => {
    expect(clampPage(7, 0, 20)).toBe(1);
  });
});

describe('buildPageItems', () => {
  it('returns empty array for totalPages <= 0', () => {
    expect(buildPageItems(1, 0)).toEqual([]);
    expect(buildPageItems(1, -1)).toEqual([]);
  });

  it('returns [1] for a single-page dataset', () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
  });

  it('returns all pages when totalPages is small (no ellipsis needed)', () => {
    expect(buildPageItems(1, 3)).toEqual([1, 2, 3]);
    expect(buildPageItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('fills a gap of exactly 1 with the missing page instead of ellipsis', () => {
    // page 5, window 2 → window=[3..7], plus 1 and 10 → sorted=[1,3,4,5,6,7,10]
    // gap 1→3 = 2 → insert page 2; gap 7→10 = 3 → ellipsis
    expect(buildPageItems(5, 10, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 'ellipsis', 10]);
  });

  it('inserts ellipsis for gaps of 2 or more hidden pages', () => {
    // page 7, window 2, totalPages 66
    expect(buildPageItems(7, 66, 2)).toEqual([1, 'ellipsis', 5, 6, 7, 8, 9, 'ellipsis', 66]);
  });

  it('handles page 1 with large dataset', () => {
    expect(buildPageItems(1, 66, 2)).toEqual([1, 2, 3, 'ellipsis', 66]);
  });

  it('handles last page with large dataset', () => {
    expect(buildPageItems(66, 66, 2)).toEqual([1, 'ellipsis', 64, 65, 66]);
  });

  it('handles page near the start (second page, window 2)', () => {
    expect(buildPageItems(2, 66, 2)).toEqual([1, 2, 3, 4, 'ellipsis', 66]);
  });

  it('handles page near the end', () => {
    expect(buildPageItems(65, 66, 2)).toEqual([1, 'ellipsis', 63, 64, 65, 66]);
  });

  it('respects a smaller window size of 1 (mobile)', () => {
    expect(buildPageItems(7, 66, 1)).toEqual([1, 'ellipsis', 6, 7, 8, 'ellipsis', 66]);
  });

  it('returns no ellipsis when window covers entire range', () => {
    expect(buildPageItems(3, 6, 2)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe('pageItemRange', () => {
  it('returns { from: 0, to: 0 } when totalItems is 0 or negative', () => {
    expect(pageItemRange(1, 20, 0)).toEqual({ from: 0, to: 0 });
    expect(pageItemRange(1, 20, -5)).toEqual({ from: 0, to: 0 });
  });

  it('returns the first-page range', () => {
    expect(pageItemRange(1, 20, 1302)).toEqual({ from: 1, to: 20 });
  });

  it('returns a mid-page range', () => {
    expect(pageItemRange(7, 20, 1302)).toEqual({ from: 121, to: 140 });
  });

  it('caps "to" at totalItems on the last partial page', () => {
    // 1302 items, 20 per page: last page is 66, items 1301-1302
    expect(pageItemRange(66, 20, 1302)).toEqual({ from: 1301, to: 1302 });
  });

  it('works with a custom page size', () => {
    expect(pageItemRange(3, 50, 200)).toEqual({ from: 101, to: 150 });
  });
});
