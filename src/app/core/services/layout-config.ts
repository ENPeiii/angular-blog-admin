import { Injectable, effect, signal, untracked } from '@angular/core';

const SHOW_DELAY_MS = 200;  // don't show spinner if request finishes within 200ms
const MIN_VISIBLE_MS = 400; // once shown, keep visible for at least 400ms

@Injectable({ providedIn: 'root' })
export class LayoutConfig {
  /** 頁面容器最大寬度，預設 1024px。個別頁面可在 ngOnInit 覆寫，ngOnDestroy 重設。 */
  maxW = signal('1024px');
  /** Header 高度（px），由 Layout 元件在 ngAfterViewInit 寫入。 */
  headerHeight = signal(0);

  private readonly _loadingCount = signal(0);
  private readonly _loadingVisible = signal(false);

  /** 防閃爍的 loading 狀態：快速請求不顯示、顯示後至少持續 400ms */
  readonly loading = this._loadingVisible.asReadonly();

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  constructor() {
    effect(() => {
      const active = this._loadingCount() > 0;
      untracked(() => this.syncVisible(active));
    });
  }

  private syncVisible(active: boolean): void {
    if (active) {
      if (this.hideTimer !== null) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      if (!this._loadingVisible() && this.showTimer === null) {
        this.showTimer = setTimeout(() => {
          this.showTimer = null;
          this._loadingVisible.set(true);
          this.shownAt = Date.now();
        }, SHOW_DELAY_MS);
      }
    } else {
      if (this.showTimer !== null) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
        return;
      }
      if (!this._loadingVisible()) return;

      const elapsed = Date.now() - this.shownAt;
      const remaining = MIN_VISIBLE_MS - elapsed;

      if (remaining <= 0) {
        this._loadingVisible.set(false);
      } else {
        this.hideTimer = setTimeout(() => {
          this.hideTimer = null;
          this._loadingVisible.set(false);
        }, remaining);
      }
    }
  }

  startLoading(): void {
    this._loadingCount.update((n) => n + 1);
  }

  stopLoading(): void {
    this._loadingCount.update((n) => Math.max(0, n - 1));
  }
}
