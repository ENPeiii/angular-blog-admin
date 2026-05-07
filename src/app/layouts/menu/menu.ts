import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ROUTES_CONSTANT } from '../../core/constants/routes-constant';
import { MenuStateService } from '../../core/services/menu-state.service';

interface MenuItem {
  label: string;
  icon: string;
  url: string;
  exact?: boolean;
}

interface MenuGroup {
  label: string;
  icon: string;
  children: MenuItem[];
}

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (menuState.isMobile() && !menuState.isCollapsed()) {
      <div class="fixed inset-0 z-40 bg-black/50" (click)="menuState.collapse()"></div>
    }

    <aside class="bg-primary-400 flex flex-col overflow-y-auto overflow-x-hidden" [class]="asideClass()">
      <nav class="flex-1 py-4 min-w-[260px]">
        <ul class="space-y-1 px-3">

          @for (item of menuItems; track item.url) {
            <li>
              <a
                [routerLink]="item.url"
                routerLinkActive="bg-primary-500 text-white"
                [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-primary-100 hover:bg-primary-500 hover:text-white transition-colors duration-200"
              >
                <i [class]="'fa-solid ' + item.icon + ' w-4 text-center'"></i>
                <span class="text-sm font-medium">{{ item.label }}</span>
              </a>
            </li>
          }

          <li><hr class="border-primary-300 my-2"></li>

          @for (group of menuGroups; track group.label) {
            <li>
              <button
                type="button"
                (click)="toggleGroup(group.label)"
                class="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-primary-100 hover:bg-primary-500 hover:text-white transition-colors duration-200"
              >
                <span class="flex items-center gap-3">
                  <i [class]="'fa-solid ' + group.icon + ' w-4 text-center'"></i>
                  <span class="text-sm font-medium">{{ group.label }}</span>
                </span>
                <i
                  class="fa-solid fa-chevron-down text-xs transition-transform duration-200"
                  [class.rotate-180]="expandedGroups().has(group.label)"
                ></i>
              </button>
              @if (expandedGroups().has(group.label)) {
                <ul class="mt-1 ml-4 pl-4 border-l border-primary-300 space-y-1">
                  @for (child of group.children; track child.url) {
                    <li>
                      <a
                        [routerLink]="child.url"
                        routerLinkActive="bg-primary-500 text-white"
                        class="flex items-center gap-3 px-4 py-2 rounded-lg text-primary-100 hover:bg-primary-500 hover:text-white transition-colors duration-200"
                      >
                        <i [class]="'fa-solid ' + child.icon + ' w-4 text-center'"></i>
                        <span class="text-sm">{{ child.label }}</span>
                      </a>
                    </li>
                  }
                </ul>
              }
            </li>
          }

        </ul>
      </nav>
    </aside>
  `,
  styles: ``,
})
export class Menu {
  menuState = inject(MenuStateService);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: 'fa-gauge', url: ROUTES_CONSTANT.HOME.url, exact: true },
    { label: '首頁設定', icon: 'fa-house', url: ROUTES_CONSTANT.INDEX.url },
    { label: '關於我', icon: 'fa-user', url: ROUTES_CONSTANT.ABOUT.url },
  ];

  menuGroups: MenuGroup[] = [
    {
      label: '文章管理',
      icon: 'fa-newspaper',
      children: [
        { label: '所有文章', icon: 'fa-list', url: ROUTES_CONSTANT.POSTS.url },
        { label: '文章標籤', icon: 'fa-tags', url: ROUTES_CONSTANT.TAGS.url },
        { label: '主題文章', icon: 'fa-book', url: ROUTES_CONSTANT.TOPICS.url },
      ],
    },
  ];

  expandedGroups = signal<Set<string>>(new Set(['文章管理']));

  asideClass(): string {
    if (this.menuState.isMobile()) {
      const translate = this.menuState.isCollapsed() ? '-translate-x-full' : 'translate-x-0';
      return `fixed top-16 left-0 z-50 w-[260px] h-[calc(100vh-64px)] transition-transform duration-300 ${translate}`;
    }
    const width = this.menuState.isCollapsed() ? 'w-0' : 'w-[260px]';
    return `h-full transition-[width] duration-300 ${width}`;
  }

  toggleGroup(label: string) {
    this.expandedGroups.update(groups => {
      const next = new Set(groups);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }
}
