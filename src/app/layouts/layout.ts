import { Component } from '@angular/core';
import { Header } from './header/header';
import { Menu } from './menu/menu';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [Header,Menu,RouterOutlet],
  template: `
    <app-menu />
    <div class="flex-1">
      <app-header />
      <router-outlet />
    </div>


  `,
  styles: `
  :host{
    display: flex;
  }
  `,
})
export class Layout {

}
