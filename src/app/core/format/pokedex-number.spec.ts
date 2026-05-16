import { describe, expect, it } from 'vitest';
import { formatPokedexNumber } from './pokedex-number';

describe('formatPokedexNumber', () => {
  it('pads single digits to four characters', () => {
    expect(formatPokedexNumber(1)).toBe('#0001');
  });

  it('pads two and three digits', () => {
    expect(formatPokedexNumber(25)).toBe('#0025');
    expect(formatPokedexNumber(151)).toBe('#0151');
  });

  it('does not truncate four-digit numbers', () => {
    expect(formatPokedexNumber(1010)).toBe('#1010');
  });
});
