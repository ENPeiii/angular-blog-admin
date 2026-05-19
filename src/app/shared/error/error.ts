import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ErrorService } from '../../core/services/error.service';

@Component({
  selector: 'app-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorService.hasError()) {
      <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        @for (error of errorService.errors(); track $index; let i = $index) {
          <div class="bg-red-700 text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
            <span class="flex-1 text-sm leading-relaxed">
              @if (error.context) {
                <span class="font-semibold block">{{ error.context }}</span>
              }
              {{ error.message }}
            </span>
            <button
              (click)="errorService.clear(i)"
              class="shrink-0 text-white hover:text-red-200 transition-colors text-lg leading-none"
              type="button"
            >✕</button>
          </div>
        }
      </div>
    }
  `,
})
export class AppError {
  protected readonly errorService = inject(ErrorService);
}
