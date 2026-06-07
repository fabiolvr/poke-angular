import { describe, expect, it } from 'vitest';
import { pickLocalized } from './localized-text';

describe('pickLocalized', () => {
  const map = new Map<string, string>([
    ['en', 'Mouse'],
    ['pt-br', 'Camundongo'],
    ['ja', 'ネズミ'],
  ]);

  it('prefers the first matching code for the language', () => {
    expect(pickLocalized(map, 'pt-BR')).toBe('Camundongo');
    expect(pickLocalized(map, 'en')).toBe('Mouse');
  });

  it('cascades pt-BR down to English when no Portuguese entry exists', () => {
    const enOnly = new Map<string, string>([['en', 'Mouse']]);
    expect(pickLocalized(enOnly, 'pt-BR')).toBe('Mouse');
  });

  it('falls back to English codes for unknown languages', () => {
    expect(pickLocalized(map, 'fr')).toBe('Mouse');
  });

  it('returns the fallback value when nothing matches', () => {
    const empty = new Map<string, string>();
    expect(pickLocalized(empty, 'pt-BR')).toBe('');
    expect(pickLocalized(empty, 'pt-BR', 'Bulbasaur')).toBe('Bulbasaur');
  });
});
