import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { BrutalSkeleton } from './brutal-skeleton';

describe('BrutalSkeleton', () => {
  it('renders an accessible loading indicator', () => {
    const fixture = TestBed.createComponent(BrutalSkeleton);
    fixture.componentRef.setInput('width', '120px');
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('span') as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Carregando');
    expect(el.style.width).toBe('120px');
    expect(el.className).toContain('brutal-pulse');
  });

  it('honours a custom aria-label and circle shape', () => {
    const fixture = TestBed.createComponent(BrutalSkeleton);
    fixture.componentRef.setInput('shape', 'circle');
    fixture.componentRef.setInput('width', '48px');
    fixture.componentRef.setInput('ariaLabel', 'Carregando sprite');
    fixture.detectChanges();
    const el = (fixture.nativeElement as HTMLElement).querySelector('span') as HTMLElement;
    expect(el.className).toContain('rounded-full');
    expect(el.getAttribute('aria-label')).toBe('Carregando sprite');
  });
});
