import { Component } from '@angular/core';
import { Header } from './header/header';
import { Menu } from './menu/menu';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [Header,Menu,RouterOutlet],
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

}
