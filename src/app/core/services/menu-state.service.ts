import { Injectable, signal, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

const MOBILE_BREAKPOINT = '(max-width: 768px)';

@Injectable({ providedIn: 'root' })
export class MenuStateService {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  isMobile = signal(false);
  isCollapsed = signal(false);

  constructor() {
    this.breakpointObserver
      .observe(MOBILE_BREAKPOINT)
      .pipe(takeUntilDestroyed())
      .subscribe(result => {
        this.isMobile.set(result.matches);
        this.isCollapsed.set(result.matches);
      });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      if (this.isMobile()) {
        this.isCollapsed.set(true);
      }
    });
  }

  toggle() {
    this.isCollapsed.update(v => !v);
  }

  collapse() {
    this.isCollapsed.set(true);
  }
}
