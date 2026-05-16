import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type Routes } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { NavigationHistoryService } from './navigation-history.service';

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class HomeComponent {}

@Component({ template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class DetailComponent {}

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'pokemon/:name', component: DetailComponent },
];

describe('NavigationHistoryService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('starts with no internal history', () => {
    const service = TestBed.inject(NavigationHistoryService);
    expect(service.hasInternalHistory()).toBe(false);
    expect(service.navigationCount()).toBe(0);
  });

  it('flips hasInternalHistory after the second navigation', async () => {
    const service = TestBed.inject(NavigationHistoryService);
    const router = TestBed.inject(Router);

    await router.navigate(['/']);
    expect(service.navigationCount()).toBe(1);
    expect(service.hasInternalHistory()).toBe(false);

    await router.navigate(['/pokemon', 'pikachu']);
    expect(service.navigationCount()).toBe(2);
    expect(service.hasInternalHistory()).toBe(true);
  });
});
