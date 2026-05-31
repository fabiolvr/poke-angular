import { describe, expect, it } from 'vitest';
import { extractIdFromUrl } from './resource-id';

describe('extractIdFromUrl', () => {
  it('reads the last segment as the dex number', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
  });

  it('handles URLs without a trailing slash', () => {
    expect(extractIdFromUrl('/pokemon-species/151')).toBe(151);
  });

  it('returns NaN for malformed input rather than throwing', () => {
    expect(Number.isNaN(extractIdFromUrl('not-a-url'))).toBe(true);
    expect(Number.isNaN(extractIdFromUrl(''))).toBe(true);
  });
});
