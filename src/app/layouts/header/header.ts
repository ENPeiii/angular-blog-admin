import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuStateService } from '../../core/services/menu-state.service';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

const ROUTE_LABEL_MAP: Record<string, string> = {
  '': 'Dashboard',
  'index': '首頁設定',
  'about': '關於我',
  'posts': '所有文章',
  'tags': '文章標籤',
  'topics': '主題文章',
};

const ROUTE_VIRTUAL_PARENT: Record<string, BreadcrumbItem> = {
  'posts': { label: '文章管理' },
  'tags': { label: '文章管理' },
  'topics': { label: '文章管理' },
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatMenuModule, MatDividerModule],
  template: `
    <header class="h-16 bg-primary-500 text-white flex items-center shrink-0">

      @if (!menuState.isMobile()) {
        <div
          class="h-full flex items-center px-4 shrink-0 overflow-hidden transition-[width,background-color] duration-300"
          [class]="menuState.isCollapsed() ? 'w-16 bg-primary-500 justify-center' : 'w-[260px] bg-primary-600 justify-between'"
        >
          @if (!menuState.isCollapsed()) {
            <span class="font-semibold text-sm tracking-wide whitespace-nowrap">後台管理</span>
          }
          <button type="button" (click)="menuState.toggle()" class="hover:text-gray-300 shrink-0">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      }

      <div class="flex-1 flex items-center justify-between px-4">
        <nav class="flex items-center space-x-2">
          @if (menuState.isMobile()) {
            <button type="button" (click)="menuState.toggle()" class="hover:text-gray-300 mr-1 shrink-0">
              <i class="fa-solid fa-bars"></i>
            </button>
          }
          <a [routerLink]="'/'" class="hover:text-gray-300"><i class="fa-solid fa-house"></i></a>
          @for (item of breadcrumbs(); track item.label) {
            <span class="text-primary-300">/</span>
            @if (item.url) {
              <a [routerLink]="item.url" class="hover:text-gray-300 text-sm">{{ item.label }}</a>
            } @else {
              <span class="text-sm">{{ item.label }}</span>
            }
          }
        </nav>
        <button
          type="button"
          [matMenuTriggerFor]="userMenu"
          class="flex items-center gap-2 hover:text-gray-300 transition-colors duration-200"
        >
          <span class="w-8 h-8 rounded-full bg-primary-300 flex items-center justify-center text-sm font-semibold">E</span>
          <span class="text-sm hidden sm:block">ENPei</span>
          <i class="fa-solid fa-chevron-down text-xs"></i>
        </button>

        <mat-menu #userMenu="matMenu" xPosition="before">
          <div class="px-4 py-3 min-w-[200px]">
            <p class="text-sm font-semibold text-gray-800">ENPei</p>
            <p class="text-xs text-gray-500 mt-0.5">labibi.lg@gmail.com</p>
          </div>
          <mat-divider />
          <button mat-menu-item class="flex items-center gap-2 text-red-500">
            <i class="fa-solid fa-right-from-bracket"></i>
            <span>登出</span>
          </button>
        </mat-menu>
      </div>

    </header>
  `,
  styles: ``,
})
export class Header {
  private router = inject(Router);
  menuState = inject(MenuStateService);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.updateBreadcrumbs(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(event => {
      this.updateBreadcrumbs((event as NavigationEnd).urlAfterRedirects);
    });
  }

  private updateBreadcrumbs(url: string) {
    const segments = url.split('/').filter(Boolean);
    if (segments.length === 0) {
      this.breadcrumbs.set([]);
      return;
    }
    const items: BreadcrumbItem[] = [];
    segments.forEach((segment, index) => {
      const virtualParent = ROUTE_VIRTUAL_PARENT[segment];
      if (virtualParent) items.push(virtualParent);
      items.push({
        label: ROUTE_LABEL_MAP[segment] ?? segment,
        url: index < segments.length - 1 ? '/' + segments.slice(0, index + 1).join('/') : undefined,
      });
    });
    this.breadcrumbs.set(items);
  }
}
