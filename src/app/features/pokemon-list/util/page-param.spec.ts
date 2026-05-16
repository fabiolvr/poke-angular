import { describe, expect, it } from 'vitest';
import {
  clampPage,
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
