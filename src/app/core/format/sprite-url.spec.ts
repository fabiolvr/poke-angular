import { describe, expect, it } from 'vitest';
import { FALLBACK_SPRITE, pokemonArtworkUrl } from './sprite-url';

describe('pokemonArtworkUrl', () => {
  it('builds the official-artwork URL for a valid id', () => {
    expect(pokemonArtworkUrl(25)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    );
  });

  it('falls back to the local placeholder for non-positive ids', () => {
    expect(pokemonArtworkUrl(0)).toBe(FALLBACK_SPRITE);
    expect(pokemonArtworkUrl(-1)).toBe(FALLBACK_SPRITE);
  });

  it('falls back to the local placeholder for non-finite ids', () => {
    expect(pokemonArtworkUrl(Number.NaN)).toBe(FALLBACK_SPRITE);
    expect(pokemonArtworkUrl(Number.POSITIVE_INFINITY)).toBe(FALLBACK_SPRITE);
  });
});
