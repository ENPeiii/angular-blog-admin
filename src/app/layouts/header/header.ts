import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {MatMenuModule} from '@angular/material/menu';

@Component({
  selector: 'app-header',
  imports: [RouterLink,MatMenuModule],
  template: `
    <header class="bg-primary-500 text-white p-4 flex items-center justify-between">
      <nav class="flex items-center space-x-4">
        <a [routerLink]="'/'" class="hover:text-gray-300"><i class="fa-solid fa-house"></i></a>
        <ul class="flex items-center space-x-2">
          <li class="flex items-center space-x-2">
            <span class="text-primary-300">/</span><a [routerLink]="'#'" class="hover:text-gray-300">首頁設定</a>
          </li>
          <li class="flex items-center space-x-2">
            <span class="text-primary-300">/</span><p>主視覺</p>
          </li>
        </ul>
      </nav>
      <button class="hover:text-gray-300" type="button" [matMenuTriggerFor]="beforeMenu">ENPei</button>
      <mat-menu #beforeMenu="matMenu" xPosition="before">
        <div class="bg-dark-500 text-white p-4">
          <p>ENPei</p>
          <p>labibi.lg@gmail.com</p>
          <button class="hover:text-gray-300" type="button">登出</button>
        </div>
      </mat-menu>
    </header>
  `,
  styles: ``,
})
export class Header {

}
