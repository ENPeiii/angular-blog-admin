import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toastService.hasToast()) {
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
        @for (toast of toastService.toasts(); track toast.id) {
          <div class="px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-48 text-white"
            [class]="toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'">
            <i class="text-sm" [class]="toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'"></i>
            <span class="text-sm">{{ toast.message }}</span>
            <button
              (click)="toastService.dismiss(toast.id)"
              class="ml-auto text-white hover:text-green-200 transition-colors text-base leading-none"
              type="button"
            >✕</button>
          </div>
        }
      </div>
    }
  `,
})
export class AppToast {
  protected readonly toastService = inject(ToastService);
}
