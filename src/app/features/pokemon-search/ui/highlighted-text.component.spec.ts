import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { HighlightedText } from './highlighted-text.component';

@Component({
  imports: [HighlightedText],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-highlighted-text [text]="text()" [query]="query()" />`,
})
class HostComponent {
  text = signal('pikachu');
  query = signal('');
}

const setup = () => {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
};

describe('HighlightedText', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'language', { configurable: true, get: () => 'pt-BR' });
  });

  it('renders plain text when there is no query', () => {
    const { root } = setup();
    expect(root.querySelector('mark')).toBeNull();
    expect(root.textContent?.trim()).toBe('pikachu');
  });

  it('wraps matching substrings in <mark>, case-insensitive', () => {
    const { fixture, host, root } = setup();
    host.query.set('PIK');
    fixture.detectChanges();

    const marks = Array.from(root.querySelectorAll('mark'));
    expect(marks).toHaveLength(1);
    expect(marks[0]!.textContent).toBe('pik');
    expect(root.textContent?.trim()).toBe('pikachu');
  });

  it('handles multiple occurrences in the same string', () => {
    const { fixture, host, root } = setup();
    host.text.set('na-na-na batman');
    host.query.set('na');
    fixture.detectChanges();

    expect(root.querySelectorAll('mark')).toHaveLength(3);
  });

  it('escapes regex metacharacters in the query', () => {
    const { fixture, host, root } = setup();
    host.text.set('mr.mime');
    host.query.set('.');
    fixture.detectChanges();

    const marks = Array.from(root.querySelectorAll('mark'));
    expect(marks).toHaveLength(1);
    expect(marks[0]!.textContent).toBe('.');
  });

  it('ignores leading/trailing whitespace in the query', () => {
    const { fixture, host, root } = setup();
    host.query.set('  pika  ');
    fixture.detectChanges();
    expect(root.querySelectorAll('mark')).toHaveLength(1);
  });
});
