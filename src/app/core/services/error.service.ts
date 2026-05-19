import { Injectable, computed, signal } from '@angular/core';

export interface AppError {
  message: string;
  context?: string;
  raw?: unknown;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private readonly _errors = signal<AppError[]>([]);

  readonly errors = this._errors.asReadonly();
  readonly hasError = computed(() => this._errors().length > 0);
  readonly latestError = computed(() => this._errors().at(-1) ?? null);

  report(raw: unknown, context?: string): void {
    const message = this.extractMessage(raw);
    this._errors.update((errs) => [...errs, { message, context, raw }]);
  }

  /** 傳入 index 清除單筆；不傳則清除全部 */
  clear(index?: number): void {
    if (index !== undefined) {
      this._errors.update((errs) => errs.filter((_, i) => i !== index));
    } else {
      this._errors.set([]);
    }
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return '發生未知錯誤';
  }
}
