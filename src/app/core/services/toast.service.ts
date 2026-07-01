import { Injectable, computed, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private counter = 0;
  private readonly _toasts = signal<Toast[]>([]);

  readonly toasts = this._toasts.asReadonly();
  readonly hasToast = computed(() => this._toasts().length > 0);

  success(message: string): void {
    this._show(message, 'success');
  }

  error(message: string): void {
    this._show(message, 'error');
  }

  private _show(message: string, type: Toast['type']): void {
    const id = ++this.counter;
    this._toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number): void {
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
