import { describe, expect, it } from 'vitest';
import { formatHeight, formatWeight } from './measurement';

describe('formatHeight', () => {
  it('converts decimetres to metres with the locale unit label', () => {
    // Pikachu: 4 dm → 0.4 m
    const en = formatHeight(4, 'en-US');
    const pt = formatHeight(4, 'pt-BR');
    expect(en).toContain('0.4');
    expect(en.toLowerCase()).toContain('m');
    expect(pt).toContain('0,4');
    expect(pt.toLowerCase()).toContain('m');
  });

  it('rounds to one decimal place', () => {
    expect(formatHeight(17, 'en-US')).toContain('1.7'); // Charizard
  });
});

describe('formatWeight', () => {
  it('converts hectograms to kilograms with the locale unit label', () => {
    // Pikachu: 60 hg → 6.0 kg
    const en = formatWeight(60, 'en-US');
    const pt = formatWeight(60, 'pt-BR');
    expect(en).toContain('6.0');
    expect(en.toLowerCase()).toContain('kg');
    expect(pt).toContain('6,0');
    expect(pt.toLowerCase()).toContain('kg');
  });
});
