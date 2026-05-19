import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmModalData {
  title: string;
  message: string;
  /** 確認按鈕文字，預設「確認刪除」 */
  confirmLabel?: string;
  /** 是否為危險操作（紅色按鈕），預設 true */
  danger?: boolean;
}

@Component({
  selector: 'app-confirm-modal',
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-4 w-full">

      <div class="flex items-start gap-4">
        <div class="shrink-0 flex items-center justify-center w-10 h-10 rounded-full"
          [class]="data.danger !== false ? 'bg-red-50' : 'bg-amber-50'"
        >
          <i class="fa-solid fa-triangle-exclamation text-base"
            [class]="data.danger !== false ? 'text-red-500' : 'text-amber-500'"
          ></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold text-gray-800">{{ data.title }}</h3>
          <p class="mt-1.5 text-sm text-gray-500 whitespace-pre-line">{{ data.message }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button
          type="button"
          (click)="dialogRef.close(false)"
          class="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-800 transition-colors duration-200"
        >
          取消
        </button>
        <button
          type="button"
          (click)="dialogRef.close(true)"
          class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors duration-200"
          [class]="data.danger !== false
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-primary-500 hover:bg-primary-600'"
        >
          {{ data.confirmLabel ?? '確認刪除' }}
        </button>
      </div>

    </div>
  `,
})
export class ConfirmModal {
  dialogRef = inject(MatDialogRef<ConfirmModal>);
  data = inject<ConfirmModalData>(MAT_DIALOG_DATA);
}
