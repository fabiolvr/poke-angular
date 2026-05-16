import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from '@layout/index';

@Component({
  selector: 'app-root',
  imports: [AppShell],
  template: '<app-app-shell />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
