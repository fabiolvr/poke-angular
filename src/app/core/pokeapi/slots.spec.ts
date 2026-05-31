import { describe, expect, it } from 'vitest';
import { mapAbilities, mapStats, mapTypes } from './slots';

describe('mapTypes', () => {
  it('orders by slot and drops names that are not canonical types', () => {
    expect(
      mapTypes([
        { slot: 2, type: { name: 'flying' } },
        { slot: 1, type: { name: 'normal' } },
        { slot: 3, type: { name: 'not-a-type' } },
      ]),
    ).toEqual(['normal', 'flying']);
  });
});

describe('mapStats', () => {
  it('maps known stats and drops unknown stat names', () => {
    expect(
      mapStats([
        { base_stat: 45, effort: 0, stat: { name: 'hp' } },
        { base_stat: 99, effort: 1, stat: { name: 'not-a-stat' } },
      ]),
    ).toEqual([{ name: 'hp', base: 45, effort: 0 }]);
  });
});

describe('mapAbilities', () => {
  it('orders by slot and preserves the hidden flag', () => {
    expect(
      mapAbilities([
        { slot: 3, is_hidden: true, ability: { name: 'lightning-rod' } },
        { slot: 1, is_hidden: false, ability: { name: 'static' } },
      ]),
    ).toEqual([
      { name: 'static', isHidden: false },
      { name: 'lightning-rod', isHidden: true },
    ]);
  });
});
