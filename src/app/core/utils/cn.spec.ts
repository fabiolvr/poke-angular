import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('joins strings with single spaces', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('flattens nested arrays', () => {
    expect(cn(['a', ['b', ['c']]], 'd')).toBe('a b c d');
  });

  it('applies object keys when their value is truthy', () => {
    expect(cn({ active: true, disabled: false, hidden: undefined })).toBe('active');
  });

  it('normalizes whitespace within strings', () => {
    expect(cn('  foo   bar  ', 'baz')).toBe('foo bar baz');
  });

  it('returns empty string when nothing is truthy', () => {
    expect(cn(false, null, undefined, '')).toBe('');
  });
});
