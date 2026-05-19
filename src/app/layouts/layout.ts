import { Component, inject } from '@angular/core';
import { Header } from './header/header';
import { Menu } from './menu/menu';
import { RouterOutlet } from '@angular/router';
import { LayoutConfig } from '../core/services/layout-config';
import { Loading } from '../shared/loading/loading';
import { AppError } from '../shared/error/error';

@Component({
  selector: 'app-layout',
  imports: [Header, Menu, RouterOutlet, Loading, AppError],
  template: `
    <app-header />
    <div class="flex flex-1 overflow-hidden">
      <app-menu />
      <main class="flex-1 overflow-auto p-2">
        <router-outlet />
      </main>
    </div>

    @if (layoutConfig.loading()) {
      <loading />
    }

    <app-error />
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
  layoutConfig = inject(LayoutConfig);
}
