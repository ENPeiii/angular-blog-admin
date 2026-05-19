import { Component, inject, effect } from '@angular/core';
import { Header } from './header/header';
import { Menu } from './menu/menu';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorService } from '../core/services/error.service';

@Component({
  selector: 'app-layout',
  imports: [Header, Menu, RouterOutlet],
  template: `
    <app-header />
    <div class="flex flex-1 overflow-hidden">
      <app-menu />
      <main class="flex-1 overflow-auto p-2">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
  :host{
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  `,
})
export class Layout {
  private snackBar = inject(MatSnackBar);
  private errorService = inject(ErrorService);

  constructor() {
    effect(() => {
      const err = this.errorService.latestError();
      if (err) {
        this.snackBar.open(err.message, '關閉', {
          duration: 5000,
          panelClass: ['error-snackbar'],
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
      }
    });
  }
}
